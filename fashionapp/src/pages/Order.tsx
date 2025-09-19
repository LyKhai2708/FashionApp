
import {Form, Input, Select, Radio, Button, Divider, Typography, Card } from "antd";
import { Package, CreditCard } from "lucide-react";
import { useMemo, useState } from "react";
import product1 from "../assets/product1.jpg";
import product2 from "../assets/product2.jpg";
import product3 from "../assets/product3.jpg";
const {Title} = Typography;

export default function Order() {
    interface CartItem {
        id: number;
        name: string;
        image: string;
        price: number;
        discount?: number;
        quantity: number;
        size?: string;
        color?: string;
    }
    
    const [cartItems, setCartItems] = useState<CartItem[]>([
        {
            id: 1,
            name: "Áo thun basic cotton",
            image: product1,
            price: 199000,
            discount: 10,
            quantity: 2,
            size: "M",
            color: "Trắng"
        },
        {
            id: 2,
            name: "Quần jeans slim fit",
            image: product2,
            price: 399000,
            quantity: 1,
            size: "32",
            color: "Xanh đậm"
        },
        {
            id: 3,
            name: "Áo khoác bomber",
            image: product3,
            price: 699000,
            discount: 15,
            quantity: 1,
            size: "L",
            color: "Đen"
        }
    ]);
      
    const formatCurrency = (value: number) => value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    const [form] = Form.useForm();
    const [shippingMethod, setShippingMethod] = useState<string | null>(null);
    const [shippingFee, setShippingFee] = useState<number>(0);
    
    const getUnitPriceAfterDiscount = (item: CartItem) => {
        if (!item.discount) return item.price;
        return Math.round(item.price * (1 - item.discount / 100));
    };
    const lineTotal = (item: CartItem) => getUnitPriceAfterDiscount(item) * item.quantity;
    const subtotal = useMemo(() => cartItems.reduce((sum, it) => sum + lineTotal(it), 0), [cartItems]);
    const total = subtotal + shippingFee;
  
    const handleFinish = (values: any) => {
        console.log("Or values:", values);
        // Xử lý đặt hàng ở đây
    };
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
                            <Form.Item  label="Tỉnh / Thành" name="province" rules={[{ required: true, message: "Chọn tỉnh / thành" }]} > 
                                <Select size="large" placeholder="Chọn tỉnh / thành"> 
                                    <Select.Option value="hcm">Hồ Chí Minh</Select.Option> 
                                    <Select.Option value="hn">Hà Nội</Select.Option> 
                                </Select> 
                            </Form.Item>
                            <Form.Item
                                label="Quận / Huyện"
                                name="district"
                                rules={[{ required: true, message: "Chọn quận / huyện" }]}>
                                <Select size="large" placeholder="Chọn quận / huyện">
                                    <Select.Option value="q1">Quận 1</Select.Option>
                                    <Select.Option value="q2">Quận 2</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label="Phường / Xã"
                                name="ward"
                                rules={[{ required: true, message: "Chọn phường / xã" }]}
                            >
                                <Select size="large" placeholder="Chọn phường / xã">
                                    <Select.Option value="p1">Phường 1</Select.Option>
                                    <Select.Option value="p2">Phường 2</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label="Địa chỉ cụ thể"
                                name="address"
                                rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                            >
                                <Input size="large" placeholder="Nhập địa chỉ" />
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
                            {cartItems.map((item) => (
                            <div key={item.id} className="flex gap-3 items-center mb-4">
                                <div className="relative">
                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                    <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {item.quantity}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">{item.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {item.color} / {item.size}
                                    </div>
                                </div>
                                <div className="text-sm font-medium">{formatCurrency(getUnitPriceAfterDiscount(item))}</div>
                            </div>
                            ))}

                            <Divider />
                            <div className="flex justify-between text-sm mb-2">
                                <span>Tạm tính</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Phí vận chuyển</span>
                                <span>{shippingFee > 0 ? formatCurrency(shippingFee) : "Miễn phí"}</span>
                            </div>
                            <Divider />
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Tổng cộng</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>    
        </div>
    )
}