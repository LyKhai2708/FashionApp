import { Button, Typography, Empty, Pagination, Modal, Input, Space, Tag } from "antd";
import { ClockCircleOutlined, SyncOutlined, CarOutlined, CheckCircleOutlined, CloseCircleOutlined, CreditCardOutlined } from '@ant-design/icons';
import { formatVNDPrice } from '../utils/priceFormatter';
import type { Order } from '../services/orderService';
import orderService from '../services/orderService';
import { useState } from 'react';
import { useMessage } from '../App';

type Props = {
  orders: Order[];
  onView: (id: number) => void;
  onOrderCancelled?: () => void;
  total?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  orderStatusFilter?: string | null;
  paymentStatusFilter?: string | null;
  onOrderStatusChange?: (status: string | null) => void;
  onPaymentStatusChange?: (status: string | null) => void;
  orderStatusCounts?: Record<string, number>;
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Chờ duyệt';
    case 'processing': return 'Đang xử lý';
    case 'shipped': return 'Đang giao';
    case 'delivered': return 'Đã giao';
    case 'cancelled': return 'Đã hủy';
    default: return status;
  }
};

const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'cod': return 'COD';
    case 'bank_transfer': return 'Chuyển khoản';
    case 'payos': return 'PayOS';
    case 'momo': return 'MoMo';
    case 'vnpay': return 'VNPay';
    default: return method;
  }
};

const getPaymentStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Chưa thanh toán';
    case 'paid': return 'Đã thanh toán';
    case 'failed': return 'Thất bại';
    case 'cancelled': return 'Đã hủy';
    case 'refunded': return 'Đã hoàn tiền';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#FFA500';
    case 'processing': return '#1890ff';
    case 'shipped': return '#13c2c2';
    case 'delivered': return '#52c41a';
    case 'cancelled': return '#ff4d4f';
    default: return '#d9d9d9';
  }
};

export default function OrdersList({ 
  orders, 
  onView, 
  onOrderCancelled, 
  total, 
  currentPage = 1, 
  pageSize = 10, 
  onPageChange,
  orderStatusFilter = null,
  paymentStatusFilter = null,
  onOrderStatusChange,
  onPaymentStatusChange,
  orderStatusCounts = {}
}: Props) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const message = useMessage();

  const handleCancelOrder = async () => {
    if (!selectedOrderId || !cancelReason.trim()) {
      message.error('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    try {
      setCancellingId(selectedOrderId);
      await orderService.cancelOrder(selectedOrderId, cancelReason.trim());
      message.success('Hủy đơn hàng thành công');
      setCancelModalVisible(false);
      setCancelReason('');
      setSelectedOrderId(null);
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancellingId(null);
    }
  };

  const showCancelModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setCancelModalVisible(true);
  };

  const orderStatusTabs = [
    { key: null, label: 'Tất cả', icon: null, color: '#666' },
    { key: 'pending', label: 'Chờ duyệt', icon: <ClockCircleOutlined />, color: '#1890ff' },
    { key: 'processing', label: 'Đang xử lý', icon: <SyncOutlined spin />, color: '#fa8c16' },
    { key: 'shipped', label: 'Đang giao hàng', icon: <CarOutlined />, color: '#722ed1' },
    { key: 'delivered', label: 'Hoàn tất', icon: <CheckCircleOutlined />, color: '#52c41a' },
    { key: 'cancelled', label: 'Đã hủy', icon: <CloseCircleOutlined />, color: '#ff4d4f' },
  ];

  const paymentStatusTabs = [
    { key: null, label: 'Tất cả' },
    { key: 'paid', label: 'Đã thanh toán', color: '#52c41a' },
    { key: 'pending', label: 'Chưa thanh toán', color: '#ff4d4f' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Typography.Title level={4} className="!mb-2">Lịch sử đơn hàng</Typography.Title>
        <Typography.Text type="secondary" className="text-sm">
          Quản lý và theo dõi tất cả đơn hàng của bạn
        </Typography.Text>
      </div>

      <div>
        <Typography.Text strong className="block mb-3 text-sm">Trạng thái đơn hàng</Typography.Text>
        <Space size="small" wrap>
          {orderStatusTabs.map((tab) => {
            const count = tab.key ? orderStatusCounts[tab.key] || 0 : orderStatusCounts['all'] || 0;
            const isActive = orderStatusFilter === tab.key;
            return (
              <Button
                key={tab.key || 'all'}
                type={isActive ? 'primary' : 'default'}
                icon={tab.icon}
                onClick={() => onOrderStatusChange?.(tab.key)}
                className={`!rounded-full !h-9 transition-all ${
                  isActive 
                    ? '!shadow-md' 
                    : '!bg-white hover:!border-gray-400'
                }`}
                style={{
                  backgroundColor: isActive ? tab.color : undefined,
                  borderColor: isActive ? tab.color : undefined,
                  color: isActive ? '#fff' : tab.color
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </Space>
      </div>

      <div>
        <Typography.Text strong className="block mb-3 text-sm">Trạng thái thanh toán</Typography.Text>
        <Space size="small" wrap>
          {paymentStatusTabs.map((tab) => {
            const isActive = paymentStatusFilter === tab.key;
            return (
              <Button
                key={tab.key || 'all-payment'}
                type={isActive ? 'primary' : 'default'}
                onClick={() => onPaymentStatusChange?.(tab.key)}
                className={`!rounded-full !h-9 transition-all ${
                  isActive 
                    ? '!shadow-md' 
                    : '!bg-white hover:!border-gray-400'
                }`}
                style={{
                  backgroundColor: isActive ? tab.color : undefined,
                  borderColor: isActive ? tab.color : undefined,
                  color: isActive ? '#fff' : (tab.color || undefined)
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Space>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Empty description="Không tìm thấy đơn hàng nào" />
        </div>
      )}

      {/* Orders List */}
      {orders.length > 0 && (
        <div className="space-y-4">
      
        {orders.map((order) => (
          <div 
            key={order.order_id} 
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Typography.Text strong className="text-base">
                      Đơn hàng #{order.order_code || order.order_id}
                    </Typography.Text>
                    <Tag 
                      color={getStatusColor(order.order_status)}
                      className="!m-0 !rounded-full !px-3"
                    >
                      {getStatusText(order.order_status)}
                    </Tag>
                  </div>
                  <Typography.Text type="secondary" className="text-xs mt-1 block">
                    Ngày: {new Date(order.order_date).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography.Text>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <Typography.Text type="secondary" className="text-sm">
                  {order.items_count || 0} sản phẩm
                </Typography.Text>
                <div className="flex items-center gap-2">
                  <Tag icon={<CreditCardOutlined />} className="!m-0">
                    {getPaymentMethodText(order.payment_method)}
                  </Tag>
                  <Tag 
                    color={order.payment_status === 'paid' ? 'success' : 'warning'}
                    className="!m-0"
                  >
                    {getPaymentStatusText(order.payment_status)}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div>
                <Typography.Text type="secondary" className="text-xs block mb-1">
                  Tổng tiền
                </Typography.Text>
                <Typography.Text strong className="text-xl" style={{ color: '#1890ff' }}>
                  {formatVNDPrice(order.total_amount)}
                </Typography.Text>
              </div>
              <div className="flex gap-2">
                {order.order_status === 'pending' && (
                  <Button 
                    danger
                    loading={cancellingId === order.order_id}
                    disabled={cancellingId !== null}
                    onClick={() => showCancelModal(order.order_id)}
                    className="!rounded-md"
                  >
                    Hủy đơn hàng
                  </Button>
                )}
                <Button 
                  type="default"
                  onClick={() => onView(order.order_id)}
                  className="!border-gray-300 !rounded-md"
                >
                  Xem chi tiết
                </Button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
      
      {/* Pagination */}
      {total && total > pageSize && (
        <div className="flex justify-center mt-6">
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={onPageChange}
            showSizeChanger={false}
            showTotal={(total) => `Tổng ${total} đơn hàng`}
          />
        </div>
      )}

      <Modal
        title="Hủy đơn hàng"
        open={cancelModalVisible}
        onOk={handleCancelOrder}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelReason('');
          setSelectedOrderId(null);
        }}
        okText="Xác nhận hủy"
        cancelText="Không hủy"
        okButtonProps={{ danger: true, loading: cancellingId !== null }}
        cancelButtonProps={{ disabled: cancellingId !== null }}
      >
        <div className="space-y-4">
          <p>Bạn có chắc chắn muốn hủy đơn hàng này không?</p>
          <div>
            <label className="block text-sm font-medium mb-2">
              Lý do hủy đơn hàng <span className="text-red-500">*</span>
            </label>
            <Input.TextArea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Vui lòng nhập lý do hủy đơn hàng..."
              rows={3}
              maxLength={500}
              showCount
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
