import {Form, Input, Select, Radio, Divider, Typography } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { message } from "antd";
import addressService from "../services/addressService";
import orderService from "../services/orderService";
import type { CreateOrderPayload } from "../services/orderService";

const {Title} = Typography;

export default function Order() {
    const navigate = useNavigate();
    const { items, totalPrice, loading: cartLoading, clearCart } = useCart();
    const { isAuthenticated, user } = useAuth();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [loadingAddress, setLoadingAddress] = useState(true);
    
    // Load tp
    useEffect(() => {
        fetch('https://provinces.open-api.vn/api/v2/?depth=1')
          .then(res => res.json())
          .then(data => setProvinces(data));
    }, []);
    const formatCurrency = (value: number) => value.toLocaleString("vi-VN");
    
    const FREE_SHIP_THRESHOLD = 200000;
    const STANDARD_SHIPPING_FEE = 30000;
    const shippingFee = totalPrice >= FREE_SHIP_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    const total = totalPrice + shippingFee;


    useEffect(() => {
        if (!isAuthenticated) {
            message.warning('Vui lòng đăng nhập để đặt hàng');
            navigate('/login');
            return;
        }
        
        if (!cartLoading && items.length === 0) {
            message.warning('Giỏ hàng trống');
            navigate('/cart');
        }
    }, [isAuthenticated, items, cartLoading, navigate]);

    useEffect(() => {
        const loadDefaultAddress = async () => {
            if (!isAuthenticated) return;
            
            try {
                setLoadingAddress(true);
                const address = await addressService.getDefaultAddress();
                
                if (address && address.province_code) {

                    form.setFieldsValue({
                        province: address.province_code,
                        ward: address.ward_code,
                        address: address.detail_address
                    });


                    const provinceRes = await fetch(
                        `https://provinces.open-api.vn/api/v2/p/${address.province_code}?depth=2`
                    );
                    const provinceData = await provinceRes.json();
                    setWards(provinceData.wards || []);
                }
            } catch (error) {
                console.error('Load address error:', error);
            } finally {
                setLoadingAddress(false);
            }
        };
        
        loadDefaultAddress();
    }, [isAuthenticated, form]);

    const [showBankInfo, setShowBankInfo] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank'>('cod');

    const handlePaymentChange = (e: any) => {
        const value = e.target.value;
        setPaymentMethod(value);
        setShowBankInfo(value === 'bank'); 
    };

    const handleProvinceChange = async (provinceCode: string) => {
        form.setFieldsValue({ ward: undefined });
        setWards([]); 
        
        if (provinceCode) {
            try {
                const res = await fetch(
                    `https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`
                );
                const data = await res.json();
                setWards(data.wards || []);
            } catch (error) {
                console.error('Error loading wards:', error);
            }
        } else {
            setWards([]);
        }
    };
  
    const handleFinish = async (values: any) => {
        const provinceName = provinces.find(p => p.code == values.province)?.name;
        const wardName = wards.find(w => w.code == values.ward)?.name;
        
        if (!provinceName || !wardName) {
            message.error('Vui lòng chọn đầy đủ địa chỉ');
            return;
        }
        
        setSubmitting(true);
        try {
            const orderPayload: CreateOrderPayload = {
                receiver_name: values.fullName,        
                receiver_phone: values.phone,       
                receiver_email: values.email,
                payment_method: values.payment,
                shipping_province: provinceName,
                shipping_province_code: values.province,
                shipping_ward: wardName,
                shipping_ward_code: values.ward,
                shipping_detail_address: values.address,
                notes: values.note,
                items: items.map(item => ({
                    product_variant_id: item.variant.variant_id,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const order = await orderService.createOrder(orderPayload);
            message.success('Đặt hàng thành công!');

            await clearCart();
            navigate(`/order/success/${order.order_id}`);
        } catch (error: any) {
            message.error(error.message || 'Đặt hàng thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    if (cartLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return null; 
    }

    return (
        <div
        className="min-h-screen flex flex-col">
            {/*Thông tin đặt hàng */}
            <div className="mt-10 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="text-xl font-semibold">Thông tin đặt hàng</div>
                    <div className="mt-4 border border-gray-200 p-4 rounded-md shadow-lg">
                        <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFinish}
                        requiredMark={false}
                        >
                            <Form.Item
                                className="w-2/3"
                                label="Họ và tên"
                                name="fullName"
                                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
                            >
                                <Input size="large" className="h-10" placeholder="Nhập họ và tên" />
                            </Form.Item>
                            <Form.Item
                                className="w-2/3"
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: "Vui lòng nhập email" },
                                    { type: "email", message: "Email không hợp lệ" },
                                ]}
                            >
                                <Input size="large" className="h-10" placeholder="Nhập email" />
                            </Form.Item>
                            <Form.Item
                                className="w-2/3"
                                label="Số điện thoại"
                                name="phone"
                                rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                            >
                                <Input size="large" className="h-10" placeholder="Nhập số điện thoại" />
                            </Form.Item>
                            <Divider></Divider>
                            <Title level={4}>Địa chỉ giao hàng</Title>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Form.Item  
                                    label="Tỉnh / Thành" 
                                    name="province" 
                                    rules={[{ required: true, message: "Chọn tỉnh / thành" }]}
                                > 
                                    <Select 
                                        size="large" 
                                        placeholder="Chọn tỉnh / thành"
                                        onChange={handleProvinceChange}
                                        loading={provinces.length === 0}
                                    > 
                                        {provinces.map(province => (
                                            <Select.Option key={province.code} value={province.code}>
                                                {province.name}
                                            </Select.Option>
                                        ))}
                                    </Select> 
                                </Form.Item>
                                
                                <Form.Item
                                    label="Phường / Xã"
                                    name="ward"
                                    rules={[{ required: true, message: "Chọn phường / xã" }]}
                                >
                                    <Select 
                                        size="large" 
                                        placeholder="Chọn phường / xã"
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
                                    label="Địa chỉ cụ thể"
                                    name="address"
                                    rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                                    className="md:col-span-2"
                                >
                                    <Input size="large" placeholder="Nhập địa chỉ cụ thể" />
                                </Form.Item>
                            </div>
                            <Divider />

                            <Title level={4}>Ghi chú cho đơn hàng</Title>
                            <Form.Item name="note" rules={[{ required: false, message: "Vui lòng nhập ghi chú" }]}>
                                <Input.TextArea rows={4} placeholder="Ghi chú cho đơn hàng" />
                            </Form.Item>

                            <Divider/>
                            {/* Phương thức vận chuyển */}
                            {/* <Title level={4}>Phương thức vận chuyển</Title>
                            <Form.Item name="shipping" rules={[{ required: true, message: "Chọn phương thức vận chuyển" }]}>
                                <Radio.Group
                                    onChange={(e) => setShippingMethod(e.target.value)}
                                    className="flex flex-col gap-3"
                                >
                                    <Radio value="standard">Giao hàng tiêu chuẩn (30.000₫)</Radio>
                                    <Radio value="express">Giao hàng nhanh (50.000₫)</Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Divider /> */}

                            {/* Phương thức thanh toán */}
                            <Title level={4}>Phương thức thanh toán</Title>

                            <Form.Item name="payment" rules={[{ required: true, message: "Chọn phương thức thanh toán" }]}>
                                <Radio.Group className="w-2/3" onChange={handlePaymentChange} value={paymentMethod}>
                                <div className=" flex flex-col items-start justify-center border border-gray-200 p-4 rounded-md shadow-lg">

                                    <Radio value="cod">
                                        <div className="flex items-center gap-2">
                                            <img className="w-8 h-8" src="/COD.jpg"/>
                                            <span className="text-lg">Thanh toán khi giao hàng (COD)</span>
                                        </div>
                                    </Radio>
                                    <Divider/>
                                    <Radio value="bank">
                                        <div className="flex items-center gap-2">
                                            <img className="w-8 h-8" src="/bank-transfer.png"/>
                                            <span className="text-lg">Thanh toán qua ngân hàng</span>
                                        </div>
                                    </Radio>
                                </div>
                                </Radio.Group>
                            </Form.Item>
                            <div
                                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                    showBankInfo ? 'max-h-[200px]' : 'max-h-0'
                                }`}
                            >
                                {showBankInfo && (
                                    <div className="mb-2 p-4 border border-gray-200 rounded-md shadow-lg bg-gray-50">
                                        <Title level={5}>Thông tin chuyển khoản</Title>
                                        <p><strong>Ngân hàng:</strong> MBBank</p>
                                        <p><strong>Số tài khoản:</strong> 0896670687</p>
                                        <p><strong>Chủ tài khoản:</strong> LY PHUONG KHAI</p>
                                        <p><strong>Nội dung chuyển khoản:</strong> [SĐT]-[Mã đơn hàng]-[Nội dung muốn thêm nếu có]</p>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Vui lòng chuyển khoản đúng số tiền {formatCurrency(total)}₫ và ghi rõ nội dung. Sau khi chuyển khoản, vui lòng gọi hotline: 0896670687 để nhân viên sẽ xác nhận và xử lý đơn hàng.
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                        </Form>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="sticky top-20">
                        <span className="text-xl font-semibold">Thông tin thanh toán</span>
                        <div className="mt-4 border border-gray-200 p-4 rounded-md shadow-lg">
                            {items.map((item) => (
                            <div key={item.cart_item_id} className="flex gap-3 items-center mb-4">
                                <div className="relative">
                                    <img src={item.thumbnail} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                                    <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {item.quantity}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">{item.product_name}</div>
                                    <div className="text-xs text-gray-500">
                                        {item.variant.size.name} {item.variant.color ? `/ ${item.variant.color.name}` : ''}
                                    </div>
                                </div>
                                <div className="text-sm font-medium">{formatCurrency(item.price)}₫</div>
                            </div>
                            ))}

                            <Divider />
                            <div className="flex justify-between text-sm mb-2">
                                <span>Tạm tính</span>
                                <span>{formatCurrency(totalPrice)}₫</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Phí vận chuyển</span>
                                <span>{shippingFee > 0 ? `${formatCurrency(shippingFee)}₫` : "Miễn phí"}</span>
                            </div>
                            {totalPrice < FREE_SHIP_THRESHOLD && totalPrice > 0 && (
                                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mb-2">
                                    Mua thêm {formatCurrency(FREE_SHIP_THRESHOLD - totalPrice)}₫ để được miễn phí ship!
                                </div>
                            )}
                            <Divider />
                            <div className="flex justify-between font-semibold text-lg mb-4">
                                <span>Tổng cộng</span>
                                <span className="text-red-500">{formatCurrency(total)}₫</span>
                            </div>
                            
                            <button
                                type="submit"
                                onClick={() => form.submit()}
                                disabled={submitting}
                                className="cursor-pointer w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {submitting ? 'Đang xử lý...' : 'ĐẶT HÀNG'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>    
        </div>
    )
}