import { Card, Form, Input, Button, DatePicker, Radio, Avatar, Typography } from "antd";
import { UserOutlined, LockOutlined, ShoppingCartOutlined, LogoutOutlined} from "@ant-design/icons";
import { useState, useEffect } from "react";
import ChangePasswordForm from "../components/ChangePasswordForm";
import OrdersList from "../components/OrderList";
import type {Order} from "../components/OrderList";
import OrderDetail from "../components/OrderDetail";    
export default function ProfilePage() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("account");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const handleFinish = (values: any) => {
    console.log("Updated profile:", values);
  };
  const logout = () => {
    console.log("Logout");
  }
  useEffect(() => {
    // Thay bằng call API thực tế
    setOrders([
      { id: "N0608213Apr24074235", date: "2024-04-13", itemsCount: 0, total: 700000, status: "Đã hủy" },
      { id: "N0608218Apr24014512", date: "2024-04-18", itemsCount: 2, total: 39990000, status: "Chờ duyệt" }
    ]);
  }, []);

  // mock detail fetch (nên gọi API theo id khi cần)
  const selectedOrder = selectedOrderId ? {
    id: selectedOrderId,
    date: "2024-04-18",
    itemsCount: 2,
    total: 39990000,
    status: "Chờ duyệt",
    payment: "Thanh toán khi nhận hàng",
    receiver: {
      name: "Kháiii",
      phone: "08966706866",
      address: "113/8e, Xã Yên Lưới, Huyện Hòa Hạ, Phú Thọ",
      email: "khai@gmail.com"
    },
    items: [
      { name: "Laptop Gaming Asus TUF F15 FX506HF HN078W", price: 20000000, qty: 1, img: "/asus.jpg" },
      { name: "Laptop Dell Inspiron 15 N3530", price: 19990000, qty: 1, img: "/dell.jpg" }
    ]
  } as any : null;
  const menuItems = [
    { key: "account", label: "Thông tin tài khoản", icon: <UserOutlined /> },
    { key: "orders", label: "Đơn hàng của tôi", icon: <ShoppingCartOutlined /> },
    { key: "password", label: "Đổi mật khẩu", icon: <LockOutlined /> },
    { key: "logout", label: "Đăng xuất", icon: <LogoutOutlined /> },
  ];

  return (
    <div className="min-h-screen flex justify-center py-8 px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="p-6 shadow-sm">
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar size={80} icon={<UserOutlined />} />
            <Typography.Title level={5} className="mt-3">Khai Ly</Typography.Title>
            <Typography.Text type="secondary">khai@gmail.com</Typography.Text>
          </div>
          <div className="flex flex-col gap-3">
            {menuItems.map((item) => (
              item.key === "logout" ? (
                <Button
                key={item.key}
                icon={item.icon}
                block
                className={`!flex items-center justify-start h-11 rounded-md font-medium transition
                  ${activeTab === item.key 
                    ? "!bg-black !text-white hover:!bg-gray-800" 
                    : "!bg-white !text-black border hover:!bg-gray-100"}`}
                onClick={() => {logout()}}
              >
                {item.label}
              </Button>
              ) : 
              (<Button
                key={item.key}
                icon={item.icon}
                block
                className={`!flex items-center justify-start h-11 rounded-md font-medium transition
                  ${activeTab === item.key 
                    ? "!bg-black !text-white hover:!bg-gray-800" 
                    : "!bg-white !text-black border hover:!bg-gray-100"}`}
                onClick={() => setActiveTab(item.key)}
              >
                {item.label}
              </Button>)
            ))}
          </div>
        </Card>

        {/* Main Content */}
        <Card className="md:col-span-3 p-6 shadow-sm">
          {activeTab === "account" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <Typography.Title level={4}>Thông tin tài khoản</Typography.Title>
              </div>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{
                  name: "Khái Ly",
                  phone: "08966706866",
                  email: "khai@gmail.com",
                  gender: "male",
                }}
              >
                <Form.Item
                  label="Họ và Tên"
                  name="name"
                  rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                    { pattern: /^[0-9]{9,11}$/, message: "Số điện thoại không hợp lệ" },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không hợp lệ" },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item label="Ngày sinh" name="birthday">
                  <DatePicker format="DD/MM/YYYY" className="w-full" />
                </Form.Item>

                <Form.Item label="Giới tính" name="gender">
                  <Radio.Group>
                    <Radio value="male">Nam</Radio>
                    <Radio value="female">Nữ</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" block size="large" className="!bg-black">
                    Cập nhật
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}

          {activeTab === "orders" && (
            <>
            {/* nếu chưa chọn order -> hiển thị list */}
            {!selectedOrderId ? (
              <OrdersList orders={orders} onView={(id) => setSelectedOrderId(id)} />
            ) : (
              <OrderDetail order={selectedOrder} onBack={() => setSelectedOrderId(null)} />
            )}
          </>
          )}
          {activeTab === "password" && (
            <ChangePasswordForm />
          )}
        </Card>
      </div>
    </div>
  );
}

