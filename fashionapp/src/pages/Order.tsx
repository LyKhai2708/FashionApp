import {Form, Input, Select, Radio, Divider, Typography } from "antd";
import { Package, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { message } from "antd";
import addressService from "../services/addressService";

const {Title} = Typography;

export default function Order() {
    const navigate = useNavigate();
    const { items, totalPrice } = useCart();
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
    const shippingFee = 0; // Free shipping
    const total = totalPrice + shippingFee;


    useEffect(() => {
        if (!isAuthenticated) {
            message.warning('Vui lòng đăng nhập để đặt hàng');
            navigate('/login');
        }
        if (items.length === 0) {
            message.warning('Giỏ hàng trống');
            navigate('/cart');
        }
    }, [isAuthenticated, items, navigate]);
    // Load default address and populate dropdowns
    useEffect(() => {
        const loadDefaultAddress = async () => {
            if (!isAuthenticated) return;
            
            try {
                setLoadingAddress(true);
                const address = await addressService.getDefaultAddress();
                
                if (address && address.province_code) {
                    // Set form values
                    form.setFieldsValue({
                        province: address.province_code,
                        ward: address.ward_code,
                        address: address.detail_address
                    });

                    // Load wards
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
        setSubmitting(true);
        try {
            
            console.log("Order data:", {
                ...values,
                provinceName,
                wardName,
                items: items.map(item => ({
                    variant_id: item.variant.variant_id,
                    quantity: item.quantity,
                    price: item.price
                })),
                total_amount: total
            });
            
            message.success('Đặt hàng thành công!');

        } catch (error: any) {
            message.error(error.message || 'Đặt hàng thất bại');
        } finally {
            setSubmitting(false);
        }
    };

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
                                <Radio.Group className="w-2/3">
                                <div className=" flex flex-col items-start justify-center border border-gray-200 p-4 rounded-md shadow-lg">

                                    <Radio value="cod">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-8 h-8" />
                                            <span className="text-lg">Thanh toán khi giao hàng (COD)</span>
                                        </div>
                                    </Radio>
                                    <Divider/>
                                    <Radio value="bank">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-8 h-8"/>
                                            <span className="text-lg">Thanh toán qua ngân hàng</span>
                                        </div>
                                    </Radio>
                                </div>
                                </Radio.Group>
                            </Form.Item>
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