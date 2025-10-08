import { Card, Form, Input, Button, DatePicker, Radio, Avatar, Typography, message, Spin } from "antd";
import { UserOutlined, LockOutlined, ShoppingCartOutlined, LogoutOutlined} from "@ant-design/icons";
import { useState, useEffect } from "react";
import ChangePasswordForm from "../components/ChangePasswordForm";
import OrdersList from "../components/OrderList";
import type {Order} from "../components/OrderList";
import OrderDetail from "../components/OrderDetail";
import orderService from "../services/orderService";
import { useAuth } from "../contexts/AuthContext";    
export default function ProfilePage() {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  
  const handleFinish = (values: any) => {
    console.log("Updated profile:", values);
  };
  
  const logout = () => {
    console.log("Logout");
  }
  
  // Load orders list
  useEffect(() => {
    const loadOrders = async () => {
      if (activeTab !== 'orders') return;
      
      try {
        setLoading(true);
        const data = await orderService.getUserOrders();
        
        const mapped = data.map((order: any) => ({
          id: order.order_id.toString(),
          date: order.order_date ? new Date(order.order_date).toLocaleDateString('vi-VN') : 'N/A',
          itemsCount: 0,
          total: order.total_amount,
          status: order.order_status === 'pending' ? 'Chờ duyệt' : 
                  order.order_status === 'processing' ? 'Đang xử lý' :
                  order.order_status === 'shipped' ? 'Đang giao' :
                  order.order_status === 'delivered' ? 'Đã giao' :
                  order.order_status === 'cancelled' ? 'Đã hủy' : 
                  order.order_status
        }));
        
        setOrders(mapped);
      } catch (error: any) {
        message.error('Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, [activeTab]);

  // Load order detail
  useEffect(() => {
    const loadOrderDetail = async () => {
      if (!selectedOrderId) {
        setOrderDetail(null);
        return;
      }
      
      try {
        setLoading(true);
        const data = await orderService.getOrderById(parseInt(selectedOrderId));
        
        setOrderDetail({
          id: data.order_id.toString(),
          date: data.order_date ? new Date(data.order_date).toLocaleDateString('vi-VN') : 'N/A',
          itemsCount: data.items?.length || 0,
          total: data.total_amount,
          status: data.order_status === 'pending' ? 'Chờ duyệt' : 
                  data.order_status === 'processing' ? 'Đang xử lý' :
                  data.order_status === 'shipped' ? 'Đang giao' :
                  data.order_status === 'delivered' ? 'Đã giao' :
                  data.order_status === 'cancelled' ? 'Đã hủy' : 
                  data.order_status,
          payment: data.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 
                   data.payment_method === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                   data.payment_method,
          receiver: {
            name: data.receiver_name || user?.username || '',
            phone: data.receiver_phone || user?.phone || '',
            address: `${data.shipping_detail_address}, ${data.shipping_ward}, ${data.shipping_province}`,
            email: data.receiver_email || user?.email || ''
          },
          items: data.items?.map(item => ({
            name: item.product_name,
            price: item.price,
            qty: item.quantity,
            img: item.image_url
          })) || []
        });
      } catch (error: any) {
        message.error('Không thể tải chi tiết đơn hàng');
        setSelectedOrderId(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrderDetail();
  }, [selectedOrderId, user]);
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
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Spin size="large" />
                </div>
              ) : !selectedOrderId ? (
                <OrdersList orders={orders} onView={(id) => setSelectedOrderId(id)} />
              ) : (
                <OrderDetail order={orderDetail} onBack={() => setSelectedOrderId(null)} />
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

