import { Card, Form, Input, Button, Avatar, Typography, Spin, Modal, DatePicker, Select } from "antd";
import { UserOutlined, LockOutlined, ShoppingCartOutlined, LogoutOutlined, HomeOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from 'dayjs';
import ChangePasswordForm from "../components/ChangePasswordForm";
import OrdersList from "../components/OrderList";
import OrderDetail from "../components/OrderDetail";
import orderService, { type Order } from "../services/orderService";
import userService from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import AddressList from "../components/address/AddressList";
import AddressForm from "../components/address/AddressForm";
import type { Address } from "../services/addressService";
import { useMessage } from '../App';
import emailVerificationService from '../services/emailVerificationService';

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
  const message = useMessage();

  //change email state
  const [newEmail, setNewEmail] = useState('');
  const [changeEmailPassword, setChangeEmailPassword] = useState('');
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);



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

  const handleChangeEmail = async () => {
    if (!newEmail) {
      message.error('Vui lòng nhập email mới');
      return;
    }

    if (!changeEmailPassword) {
      message.error('Vui lòng nhập mật khẩu xác nhận');
      return;
    }

    if (newEmail === userInfo?.email) {
      message.error('Email mới trùng với email hiện tại');
      return;
    }

    try {
      await emailVerificationService.sendVerificationChangeEmail(newEmail, changeEmailPassword);
      setEmailVerificationSent(true);
      setEmailCountdown(60);
      message.success('Email xác nhận đã được gửi! Vui lòng kiểm tra hộp thư.');
    } catch (error: any) {
      message.error(error.message || 'Gửi email thất bại');
    }
  };


  const handleUpdateProfile = async (values: any) => {
    if (!user?.id) return;

    try {
      setUpdating(true);
      await userService.updateUser(user.id, {
        username: values.name,
        email: values.email,
        phone: values.phone || null,
        birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null,
        gender: values.gender || null
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
        birth_date: data.birth_date ? dayjs(data.birth_date) : null,
        gender: data.gender,
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

  // Email countdown timer
  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);



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
        message.error(error.data.message || 'Không thể tải chi tiết đơn hàng');
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
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <UserOutlined style={{ fontSize: '40px', color: '#6B7280' }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {userInfo?.username || user?.username || 'Loading...'}
            </h2>
            <p className="text-gray-500 text-sm">
              {userInfo?.email || user?.email || 'Loading...'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => item.key === 'logout' ? handleLogout() : setActiveTab(item.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left
                  ${activeTab === item.key
                    ? 'bg-[#111827] text-white shadow-md'
                    : 'bg-transparent text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
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
                onFinish={handleUpdateProfile}
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
                  name="phone"
                  rules={[
                    { pattern: /^[0-9]{10}$/, message: "Số điện thoại không hợp lệ!" }
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Nhập số điện thoại" />
                </Form.Item>

                <Form.Item
                  label="Ngày sinh"
                  name="birth_date"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="Chọn ngày sinh"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>

                <Form.Item
                  label="Giới tính"
                  name="gender"
                >
                  <Select placeholder="Chọn giới tính">
                    <Select.Option value="male">Nam</Select.Option>
                    <Select.Option value="female">Nữ</Select.Option>
                    <Select.Option value="other">Khác</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Email"
                >
                  <div className="flex gap-2">
                    <Input disabled value={userInfo?.email} style={{ flex: 1 }} />
                    <Button
                      onClick={() => {
                        setNewEmail('');
                        setChangeEmailPassword('');
                        setIsChangeEmailModalOpen(true);
                      }}
                    >
                      Thay đổi
                    </Button>
                  </div>
                </Form.Item>

                <Modal
                  title="Thay đổi địa chỉ Email"
                  open={isChangeEmailModalOpen}
                  onCancel={() => setIsChangeEmailModalOpen(false)}
                  footer={null}
                >
                  <div className="flex flex-col gap-4 py-4">
                    {!emailVerificationSent ? (
                      <>
                        <p className="text-gray-600">
                          Vui lòng nhập email mới và mật khẩu hiện tại để xác nhận thay đổi.
                        </p>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email mới</label>
                          <Input
                            placeholder="Nhập email mới"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                          <Input.Password
                            placeholder="Nhập mật khẩu để xác nhận"
                            value={changeEmailPassword}
                            onChange={(e) => setChangeEmailPassword(e.target.value)}
                          />
                        </div>

                        <Button
                          type="primary"
                          onClick={handleChangeEmail}
                          loading={emailCountdown > 0}
                          disabled={!newEmail || !changeEmailPassword}
                          className="!bg-black !text-white mt-2"
                          block
                        >
                          Gửi xác nhận
                        </Button>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-700">
                            ✅ Email xác nhận đã được gửi đến <strong>{newEmail}</strong>
                          </p>
                        </div>
                        <p className="text-gray-600 mb-4">
                          Vui lòng kiểm tra hộp thư và click vào link xác nhận để hoàn tất việc thay đổi email.
                        </p>
                        <Button onClick={() => setIsChangeEmailModalOpen(false)}>
                          Đóng
                        </Button>
                      </div>
                    )}
                  </div>
                </Modal>


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


    </div>
  );
}

