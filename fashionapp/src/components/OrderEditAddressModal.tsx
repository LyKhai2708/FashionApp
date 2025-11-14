import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, message } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import type { Order } from '../services/orderService';
import orderService from '../services/orderService';

interface OrderEditAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: Order;
}

const OrderEditAddressModal: React.FC<OrderEditAddressModalProps> = ({
  visible,
  onClose,
  onSuccess,
  order
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(true);

  useEffect(() => {
    if (visible) {
      fetch('http://provinces.open-api.vn/api/v2/?depth=1')
        .then(res => res.json())
        .then(data => {
          setProvinces(data || []);
          setLoadingAddress(false);
        })
        .catch(error => {
          console.error('Error loading provinces:', error);
          setLoadingAddress(false);
        });
    }
  }, [visible]);

  useEffect(() => {
    if (visible && order && provinces.length > 0) {
      form.setFieldsValue({
        receiver_name: order.receiver_name,
        receiver_phone: order.receiver_phone,
        receiver_email: order.receiver_email,
        province: order.shipping_province_code,
        ward: order.shipping_ward_code,
        detail_address: order.shipping_detail_address,
      });

      if (order.shipping_province_code) {
        handleProvinceChange(order.shipping_province_code.toString());
        setTimeout(() => {
          form.setFieldsValue({ 
            ward: order.shipping_ward_code 
          });
        }, 100);
      }
    }
  }, [visible, order, provinces, form]);

  const handleProvinceChange = async (provinceCode: string) => {
    form.setFieldsValue({ ward: undefined });
    setWards([]);
    
    if (provinceCode) {
      try {
        const res = await fetch(
          `http://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`
        );
        const data = await res.json();
        setWards(data.wards || []);
      } catch (error) {
        console.error('Error loading wards:', error);
      }
    }
  };

  const handleSubmit = async (values: any) => {
    const provinceName = provinces.find(p => p.code == values.province)?.name;
    const wardName = wards.find(w => w.code == values.ward)?.name;
    
    if (!provinceName || !wardName) {
      message.error('Vui lòng chọn đầy đủ địa chỉ');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        receiver_name: values.receiver_name,
        receiver_phone: values.receiver_phone,
        receiver_email: values.receiver_email,
        shipping_province: provinceName,
        shipping_province_code: values.province,
        shipping_ward: wardName,
        shipping_ward_code: values.ward,
        shipping_detail_address: values.detail_address,
      };

      await orderService.updateOrderAddress(order.order_id, payload);
      message.success('Cập nhật địa chỉ đơn hàng thành công');
      onSuccess();
    } catch (error: any) {
      message.error(error.message || 'Không thể cập nhật địa chỉ đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <HomeOutlined />
          <span>Sửa địa chỉ đơn hàng #{order?.order_code || order?.order_id}</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <div className="mb-4">
          <h4 className="text-base font-medium mb-3">Thông tin người nhận</h4>
          
          <Form.Item
            label="Tên người nhận"
            name="receiver_name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên người nhận' },
              { min: 2, message: 'Tên người nhận phải có ít nhất 2 ký tự' },
              { max: 100, message: 'Tên người nhận không vượt quá 100 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tên người nhận" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="receiver_phone"
            rules={[
              {
                required: true,
                pattern: /^(0)[0-9]{9,10}$/,
                message: 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0, có 10-11 số)'
              }
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="receiver_email"
            rules={[
              { required: true, type: 'email', message: 'Email không hợp lệ' },
              { max: 100, message: 'Email không vượt quá 100 ký tự' }
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>
        </div>

        <div className="mb-4">
          <h4 className="text-base font-medium mb-3">Địa chỉ giao hàng</h4>
          
          <Form.Item
            label="Tỉnh/Thành phố"
            name="province"
            rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
          >
            <Select 
              placeholder="Chọn tỉnh/thành phố"
              onChange={handleProvinceChange}
              loading={loadingAddress}
            >
              {provinces.map(province => (
                <Select.Option key={province.code} value={province.code}>
                  {province.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Phường/Xã"
            name="ward"
            rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
          >
            <Select 
              placeholder="Chọn phường/xã"
              disabled={wards.length === 0}
            >
              {wards.map(ward => (
                <Select.Option key={ward.code} value={ward.code}>
                  {ward.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Địa chỉ chi tiết"
            name="detail_address"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ chi tiết' },
              { min: 5, message: 'Địa chỉ phải có ít nhất 5 ký tự' },
              { max: 200, message: 'Địa chỉ không vượt quá 200 ký tự' }
            ]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Số nhà, tên đường..." 
            />
          </Form.Item>
        </div>

        <div className="flex gap-3 justify-end">
          <Button onClick={handleCancel}>
            Hủy
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            className="!bg-black"
          >
            Cập nhật địa chỉ
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default OrderEditAddressModal;
