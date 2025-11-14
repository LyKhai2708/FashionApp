import { Card, Form, Input, Button, Avatar, Typography, Spin, Modal } from "antd";
import { UserOutlined, LockOutlined, ShoppingCartOutlined, LogoutOutlined, HomeOutlined, PhoneOutlined} from "@ant-design/icons";
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
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const orderLimit = 5;
  const [orderStatusFilter, setOrderStatusFilter] = useState<string | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | null>(null);
  const [orderStatusCounts, setOrderStatusCounts] = useState<Record<string, number>>({});
  const [userInfo, setUserInfo] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const message = useMessage()
  
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
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
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleSendOtp = async () => {
    if (!phoneInput) {
      message.error('Vui lòng nhập số điện thoại');
      return;
    }
    
    const phonePattern = /^(0)[0-9]{9,10}$/;
    if (!phonePattern.test(phoneInput)) {
      message.error('Số điện thoại không hợp lệ');
      return;
    }
    
    try {
      setOtpLoading(true);
      await userService.sendPhoneOtp(phoneInput);
      setOtpSent(true);
      setCountdown(60);
      message.success('Mã OTP đã được gửi đến số điện thoại của bạn');
    } catch (error: any) {
      message.error(error.message || 'Không thể gửi OTP');
    } finally {
      setOtpLoading(false);
    }
  };
  
  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.length !== 6) {
      message.error('Vui lòng nhập mã OTP 6 số');
      return;
    }
    
    try {
      setOtpLoading(true);
      await userService.verifyPhone(phoneInput, otpInput);
      message.success('Xác thực thành công! Số điện thoại đã được thêm.');
      setShowPhoneModal(false);
      setPhoneInput('');
      setOtpInput('');
      setOtpSent(false);
      loadUserInfo();
    } catch (error: any) {
      message.error(error.message || 'Xác thực OTP thất bại');
    } finally {
      setOtpLoading(false);
    }
  };
  
  const handleClosePhoneModal = () => {
    setShowPhoneModal(false);
    setPhoneInput('');
    setOtpInput('');
    setOtpSent(false);
    setCountdown(0);
  };
  const handleFinish = async (values: any) => {
    if (!user?.id) return;
    
    try {
      setUpdating(true);
      await userService.updateUser(user.id, {
        username: values.name,
        email: values.email
      });
      
      message.success('Cập nhật thông tin thành công!');
      
      loadUserInfo();
    } catch (error: any) {
      message.error(error.message || 'Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };
  
  const { logout: doLogout } = useAuth();
  const handleLogout = async () => {
    try {
      await doLogout();
      message.success('Đăng xuất thành công');
      window.location.href = '/';
    } catch (e) {
      message.error('Đăng xuất thất bại');
    }
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
  

  const loadOrders = async () => {
    if (activeTab !== 'orders') return;
    
    try {
      setLoading(true);
      const params: any = { page: orderPage, limit: orderLimit };
      
      if (orderStatusFilter) {
        params.order_status = orderStatusFilter;
      }
      
      if (paymentStatusFilter) {
        params.payment_status = paymentStatusFilter;
      }
      
      const data = await orderService.getUserOrders(params.page, params.limit, params.order_status, params.payment_status);
      setOrders(data.orders);
      setOrderTotal(data.pagination.total);
    } catch (error) {
      message.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };
  
  const loadOrderCounts = async () => {
    if (activeTab !== 'orders') return;
    
    try {
      const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      const counts: Record<string, number> = {};
      
      try {
        const allData = await orderService.getUserOrders(1, 1);
        counts['all'] = allData.pagination.total;
      } catch (error) {
        counts['all'] = 0;
      }
      
      await Promise.all(
        statuses.map(async (status) => {
          try {
            const data = await orderService.getUserOrders(1, 1, status);
            counts[status] = data.pagination.total;
          } catch (error) {
            counts[status] = 0;
          }
        })
      );
      
      setOrderStatusCounts(counts);
    } catch (error) {
      console.error('Error loading order counts:', error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab, orderPage, orderStatusFilter, paymentStatusFilter]);
  
  useEffect(() => {
    loadOrderCounts();
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
  const allMenuItems = [
    { key: "account", label: "Thông tin tài khoản", icon: <UserOutlined /> },
    { key: "orders", label: "Đơn hàng", icon: <ShoppingCartOutlined /> },
    { key: "addresses", label: "Địa chỉ", icon: <HomeOutlined /> },
    { key: "password", label: "Đổi mật khẩu", icon: <LockOutlined /> },
    { key: "logout", label: "Đăng xuất", icon: <LogoutOutlined /> },
  ];
  const menuItems = allMenuItems.filter(item => {
    if (item.key === 'password') {
      return userInfo?.has_password !== false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex justify-center py-8 px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-6">

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
                className={`!flex items-center justify-center h-11 rounded-md font-medium transition
                  ${activeTab === item.key 
                    ? "!bg-black !text-white hover:!bg-gray-800" 
                    : "!bg-white !text-black border hover:!bg-gray-100"}`}
                onClick={handleLogout}
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
                  rules={[
                    { required: true, message: "Vui lòng nhập họ tên" },
                    { min: 2, message: "Họ tên phải có ít nhất 2 ký tự" },
                    { max: 100, message: "Họ tên không vượt quá 100 ký tự" }
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                >
                  {userInfo?.phone && userInfo.phone !== '' ? (
                    <Input 
                      value={userInfo.phone}
                      disabled 
                      className="!bg-gray-100 !cursor-not-allowed"
                      suffix={<span className="text-green-500">✓ Đã xác thực</span>}
                    />
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        disabled 
                        placeholder="Chưa có số điện thoại"
                        className="!bg-gray-50"
                      />
                      <Button 
                        type="primary"
                        icon={<PhoneOutlined />}
                        onClick={() => setShowPhoneModal(true)}
                        className="!bg-black"
                      >
                        Thêm SĐT
                      </Button>
                    </div>
                  )}
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không hợp lệ" },
                    { max: 100, message: "Email không vượt quá 100 ký tự" }
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
                <OrdersList 
                  orders={orders} 
                  onView={setSelectedOrderId}
                  onOrderCancelled={loadOrders}
                  total={orderTotal}
                  currentPage={orderPage}
                  pageSize={orderLimit}
                  onPageChange={setOrderPage}
                  orderStatusFilter={orderStatusFilter}
                  paymentStatusFilter={paymentStatusFilter}
                  onOrderStatusChange={(status) => {
                    setOrderStatusFilter(status);
                    setOrderPage(1);
                  }}
                  onPaymentStatusChange={(status) => {
                    setPaymentStatusFilter(status);
                    setOrderPage(1);
                  }}
                  orderStatusCounts={orderStatusCounts}
                />
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

      <Modal
        title="Thêm số điện thoại"
        open={showPhoneModal}
        onCancel={handleClosePhoneModal}
        footer={null}
        width={450}
      >
        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Số điện thoại</label>
            <div className="flex gap-2">
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Nhập số điện thoại"
                value={phoneInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9+]/g, '');
                  setPhoneInput(value);
                }}
                disabled={otpSent}
                size="large"
              />
              <Button
                type="primary"
                onClick={() => {
                  if (countdown > 0) return;
                  handleSendOtp();
                }}
                loading={otpLoading}
                className={`!bg-black ${countdown > 0 ? '!opacity-60 !cursor-not-allowed' : ''}`}
                size="large"
              >
                {otpSent ? (countdown > 0 ? `${countdown}s` : 'Gửi lại') : 'Gửi OTP'}
              </Button>
            </div>
          </div>

          {otpSent && (
            <div>
              <label className="block text-sm font-medium mb-2">Mã OTP</label>
              <Input
                placeholder="Nhập mã OTP 6 số"
                value={otpInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setOtpInput(value);
                }}
                maxLength={6}
                size="large"
              />
            </div>
          )}

          {otpSent && (
            <Button
              type="primary"
              block
              size="large"
              onClick={handleVerifyOtp}
              loading={otpLoading}
              className="!bg-black"
            >
              Xác thực
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}

