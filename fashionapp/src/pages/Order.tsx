import { Form, Input, Select, Radio, Divider, Typography, message } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getImageUrl } from '../utils/imageHelper';
import addressService from "../services/addressService";
import orderService from "../services/orderService";
import type { CreateOrderPayload } from "../services/orderService";
import paymentService from "../services/paymentService";
import { SHIPPING } from '../config/constants';

const { Title } = Typography;

export default function Order() {
    const navigate = useNavigate();
    const { items, totalPrice, loading: cartLoading, clearCart, appliedVoucher, removeVoucher } = useCart();
    const { isAuthenticated, user } = useAuth();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [loadingAddress, setLoadingAddress] = useState(true);

    // Load tp
    useEffect(() => {
        fetch('http://provinces.open-api.vn/api/v2/?depth=1')
            .then(res => res.json())
            .then(data => setProvinces(data));
    }, []);
    const formatCurrency = (value: number) => value.toLocaleString("vi-VN");

    const shippingFee = SHIPPING.STANDARD_FEE;
    const voucherDiscount = appliedVoucher?.order_summary.discount_amount || 0;
    const orderTotal = totalPrice + shippingFee - voucherDiscount;


    useEffect(() => {
        if (!isAuthenticated) {
            message.warning('Please login to place order');
            navigate('/login');
            return;
        }

        if (!cartLoading && items.length === 0) {
            message.warning('Cart is empty');
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
                        address: address.detail_address,
                        fullName: address.receiver_name || user?.username || '',
                        phone: address.receiver_phone || user?.phone || '',
                        email: address.receiver_email || user?.email || ''
                    });


                    const provinceRes = await fetch(
                        `http://provinces.open-api.vn/api/v2/p/${address.province_code}?depth=2`
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
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer' | 'payos'>('cod');

    const handlePaymentChange = (e: any) => {
        const value = e.target.value;
        setPaymentMethod(value);
        setShowBankInfo(value === 'bank_transfer');
    };

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
        } else {
            setWards([]);
        }
    };

    const handleFinish = async (values: any) => {
        const provinceName = provinces.find(p => p.code == values.province)?.name;
        const wardName = wards.find(w => w.code == values.ward)?.name;

        if (!provinceName || !wardName) {
            message.error('Please select complete address');
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
                voucher_code: appliedVoucher?.voucher?.code || null,
                items: items.map(item => ({
                    product_variant_id: item.variant.variant_id,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const order = await orderService.createOrder(orderPayload);
            message.success('Order placed successfully!');

            if (values.payment === 'payos') {
                try {
                    const paymentLink = await paymentService.createPaymentLink({
                        orderId: order.order_id,
                        returnUrl: `${window.location.origin}/order/success/${order.order_id}?payment=payos`,
                        cancelUrl: `${window.location.origin}/payment/cancel/${order.order_id}`
                    });

                    window.location.href = paymentLink.checkoutUrl;
                } catch (paymentError: any) {
                    message.error(paymentError.message || 'Cannot create payment link');
                    await clearCart();
                    navigate(`/order/success/${order.order_id}`);
                }
            } else {
                await clearCart();
                navigate(`/order/success/${order.order_id}`);
            }
        } catch (error: any) {
            message.error(error.message || 'Order placement failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (cartLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading cart...</p>
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
                    <div className="text-xl font-semibold">Order Information</div>
                    <div className="mt-4 border border-gray-200 p-4 rounded-md shadow-lg">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleFinish}
                            requiredMark={false}
                        >
                            <Form.Item
                                className="w-2/3"
                                label="Full name"
                                name="fullName"
                                rules={[
                                    { required: true, message: "Please enter full name" },
                                    { min: 2, message: "Full name must be at least 2 characters" },
                                    { max: 100, message: "Full name must not exceed 100 characters" },
                                    {
                                        pattern: /^[a-zA-Z0-9\s\u0100-\u01B0\u1E00-\u1EFF.'-]+$/,
                                        message: "Full name can only contain letters, numbers, spaces, dots, hyphens or parentheses"
                                    }
                                ]}
                            >
                                <Input size="large" className="h-10" placeholder="Enter full name" />
                            </Form.Item>
                            <Form.Item
                                className="w-2/3"
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: "Please enter email" },
                                    { type: "email", message: "Invalid email format" },
                                    { max: 100, message: "Email must not exceed 100 characters" }
                                ]}
                            >
                                <Input size="large" className="h-10" placeholder="Enter email" />
                            </Form.Item>
                            <Form.Item
                                className="w-2/3"
                                label="Phone number"
                                name="phone"
                                rules={[
                                    { required: true, message: "Please enter phone number" },
                                    { pattern: /^(0)[0-9]{9,10}$/, message: "Invalid phone number (must start with 0, 10-11 digits)" }
                                ]}
                            >
                                <Input size="large" className="h-10" placeholder="Enter phone number" />
                            </Form.Item>
                            <Divider></Divider>
                            <Title level={4}>Shipping Address</Title>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Form.Item
                                    label="Province / City"
                                    name="province"
                                    rules={[{ required: true, message: "Select province / city" }]}
                                >
                                    <Select
                                        size="large"
                                        placeholder="Select province / city"
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
                                    label="District / Ward"
                                    name="ward"
                                    rules={[{ required: true, message: "Select district / ward" }]}
                                >
                                    <Select
                                        size="large"
                                        placeholder="Select district / ward"
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
                                    label="Detailed address"
                                    name="address"
                                    rules={[
                                        { required: true, message: "Please enter address" },
                                        { min: 5, message: "Address must be at least 5 characters" },
                                        { max: 200, message: "Address must not exceed 200 characters" },
                                        {
                                            pattern: /^[a-zA-Z0-9\s\u0100-\u01B0\u1E00-\u1EFF.,/#()-]+$/,
                                            message: "Address contains invalid characters"
                                        }
                                    ]}
                                    className="md:col-span-2"
                                >
                                    <Input size="large" placeholder="Enter detailed address" />
                                </Form.Item>
                            </div>
                            <Divider />

                            <Title level={4}>Order Notes</Title>
                            <Form.Item name="note" rules={[{ max: 500, message: "Notes must not exceed 500 characters" }]}>
                                <Input.TextArea rows={4} placeholder="Notes for order" />
                            </Form.Item>

                            <Divider />
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
                            <Title level={4}>Payment Method</Title>

                            <Form.Item name="payment" rules={[{ required: true, message: "Select payment method" }]}>
                                <Radio.Group className="w-2/3" onChange={handlePaymentChange} value={paymentMethod}>
                                    <div className="flex flex-col items-start justify-center border border-gray-200 p-4 rounded-md shadow-lg">
                                        <Radio value="cod">
                                            <div className="flex items-center gap-2">
                                                <img className="w-8 h-8" src="/COD.jpg" />
                                                <span className="text-lg">Cash on Delivery (COD)</span>
                                            </div>
                                        </Radio>
                                        <Divider />
                                        <Radio value="payos">
                                            <div className="flex items-center gap-2">
                                                <img className="w-8 h-8" src="/payos.png" />
                                                <span className="text-lg">Online Payment (PayOS)</span>
                                            </div>
                                        </Radio>
                                        <Divider />
                                        <Radio value="bank_transfer">
                                            <div className="flex items-center gap-2">
                                                <img className="w-8 h-8" src="/bank-transfer.png" />
                                                <span className="text-lg">Bank Transfer</span>
                                            </div>
                                        </Radio>
                                    </div>
                                </Radio.Group>
                            </Form.Item>
                            <div
                                className={`overflow-hidden transition-all duration-500 ease-in-out ${showBankInfo ? 'max-h-[200px]' : 'max-h-0'
                                    }`}
                            >
                                {showBankInfo && (
                                    <div className="mb-2 p-4 border border-gray-200 rounded-md shadow-lg bg-gray-50">
                                        <Title level={5}>Bank Transfer Information</Title>
                                        <p><strong>Bank:</strong> MBBank</p>
                                        <p><strong>Account Number:</strong> 0896670687</p>
                                        <p><strong>Account Holder:</strong> LY PHUONG KHAI</p>
                                        <p><strong>Transfer Content:</strong> [Phone]-[Order Code]-[Additional notes if any]</p>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Please transfer exactly {formatCurrency(orderTotal)}₫ and include the content. After transfer, please call hotline: 0896670687 for staff to confirm and process your order.
                                        </p>
                                    </div>
                                )}
                            </div>

                        </Form>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="sticky top-20">
                        <span className="text-xl font-semibold">Payment Information</span>
                        <div className="mt-4 border border-gray-200 p-4 rounded-md shadow-lg">
                            {items.map((item) => (
                                <div key={item.cart_item_id} className="flex gap-3 items-center mb-4">
                                    <div className="relative">
                                        <img src={getImageUrl(item.thumbnail)} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
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
                                <span>Subtotal</span>
                                <span>{formatCurrency(totalPrice)}₫</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Shipping fee</span>
                                <span>{formatCurrency(shippingFee)}₫</span>
                            </div>
                            {voucherDiscount > 0 && (
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Discount</span>
                                    <span className="text-red-500">-{formatCurrency(voucherDiscount)}₫</span>
                                </div>
                            )}
                            <Divider />
                            <div className="flex justify-between font-semibold text-lg mb-4">
                                <span>Total</span>
                                <span className="text-red-500">{formatCurrency(orderTotal)}₫</span>
                            </div>

                            {/* Applied Voucher Display */}
                            {appliedVoucher && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-green-800">Applied voucher:</span>
                                        <button
                                            onClick={removeVoucher}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className="text-sm text-green-700">
                                        <div className="font-medium">{appliedVoucher.voucher.code}</div>
                                        <div>{appliedVoucher.voucher.name}</div>
                                        {appliedVoucher.voucher.description && (
                                            <div className="text-xs mt-1">{appliedVoucher.voucher.description}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                onClick={() => form.submit()}
                                disabled={submitting}
                                className="cursor-pointer w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {submitting ? 'Processing...' : 'PLACE ORDER'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}