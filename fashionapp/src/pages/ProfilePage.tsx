import { Card, Form, Input, Button, DatePicker, Radio, Avatar, Typography, Spin } from "antd";
import { UserOutlined, LockOutlined, ShoppingCartOutlined, LogoutOutlined, HomeOutlined} from "@ant-design/icons";
import { useState, useEffect } from "react";
import ChangePasswordForm from "../components/ChangePasswordForm";
import OrdersList from "../components/OrderList";
import OrderDetail from "../components/OrderDetail";
import orderService, { type Order } from "../services/orderService";
import userService from "../services/userService";
import { useAuth } from "../contexts/AuthContext";    
import AddressList from "../components/address/AddressList";
import AddressForm from "../components/address/AddressForm";
import type { Address } from "../services/addressService";
import { useMessage } from '../App'
export default function ProfilePage() {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const message = useMessage()
  
  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
  };
  
  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };
  
  const handleAddressFormBack = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };
  
  const handleAddressFormSuccess = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };
  const handleFinish = async (values: any) => {
    if (!user?.id) return;
    
    console.log('Updating user with values:', values); // ← DEBUG
    console.log('User ID:', user.id); // ← DEBUG
    
    try {
      setUpdating(true);
      await userService.updateUser(user.id, {
        username: values.name,
        email: values.email,
        phone: values.phone
      });
      
      message.success('Cập nhật thông tin thành công!');
      
      loadUserInfo();
    } catch (error: any) {
      message.error(error.message || 'Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };
  
  const logout = () => {
    console.log("Logout");
  }
  
  // Load user info
  const loadUserInfo = async () => {
    if (!user?.id) return;
    
    try {
      const data = await userService.getUserById(user.id);
      setUserInfo(data);
      
      form.setFieldsValue({
        name: data.username,
        email: data.email,
        phone: data.phone,
      });
    } catch (error: any) {
      message.error('Không thể tải thông tin người dùng');
    }
  };
  
  // Load user info on mount
  useEffect(() => {
    if (user?.id) {
      loadUserInfo();
    }
  }, [user?.id]);
  
  // Load orders list
  useEffect(() => {
    const loadOrders = async () => {
      if (activeTab !== 'orders') return;
      
      try {
        setLoading(true);
        const data = await orderService.getUserOrders();
        setOrders(data);
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
        const data = await orderService.getOrderById(selectedOrderId);
        setOrderDetail(data);
      } catch (error: any) {
        message.error(error.data.message || 'Không thể tải chi tiết đơn hàng' );
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
    { key: "addresses", label: "Địa chỉ giao hàng", icon: <HomeOutlined /> },
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
            <Typography.Title level={5} className="mt-3">
              {userInfo?.username || user?.username || 'Loading...'}
            </Typography.Title>
            <Typography.Text type="secondary">
              {userInfo?.email || user?.email || 'Loading...'}
            </Typography.Text>
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


                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    size="large" 
                    className="!bg-black"
                    loading={updating}
                  >
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
                <OrdersList orders={orders} onView={setSelectedOrderId} />
              ) : (
                <OrderDetail order={orderDetail} onBack={() => setSelectedOrderId(null)} />
              )}
            </>
          )}
          {activeTab === "addresses" && (
            <>
              {!showAddressForm ? (
                <AddressList 
                  onAddAddress={handleAddAddress}
                  onEditAddress={handleEditAddress}
                />
              ) : (
                <AddressForm 
                  address={editingAddress}
                  onBack={handleAddressFormBack}
                  onSuccess={handleAddressFormSuccess}
                />
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

