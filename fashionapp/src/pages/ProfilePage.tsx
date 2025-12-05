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
      message.error('Please enter new email');
      return;
    }

    if (!changeEmailPassword) {
      message.error('Please enter password to confirm');
      return;
    }

    if (newEmail === userInfo?.email) {
      message.error('New email is the same as current email');
      return;
    }

    try {
      await emailVerificationService.sendVerificationChangeEmail(newEmail, changeEmailPassword);
      setEmailVerificationSent(true);
      setEmailCountdown(60);
      message.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      message.error(error.message || 'Failed to send email');
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

      message.success('Profile updated successfully!');

      loadUserInfo();
    } catch (error: any) {
      message.error(error.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const { logout: doLogout } = useAuth();
  const handleLogout = async () => {
    try {
      await doLogout();
      message.success('Logged out successfully');
      window.location.href = '/';
    } catch (e) {
      message.error('Logout failed');
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
      message.error('Cannot load user information');
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
      message.error('Cannot load order list');
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
        message.error(error.data.message || 'Cannot load order details');
        setSelectedOrderId(null);
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetail();
  }, [selectedOrderId, user]);
  const allMenuItems = [
    { key: "account", label: "Account Information", icon: <UserOutlined /> },
    { key: "orders", label: "Orders", icon: <ShoppingCartOutlined /> },
    { key: "addresses", label: "Addresses", icon: <HomeOutlined /> },
    { key: "password", label: "Change Password", icon: <LockOutlined /> },
    { key: "logout", label: "Logout", icon: <LogoutOutlined /> },
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
                <Typography.Title level={4}>Account Information</Typography.Title>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateProfile}
              >
                <Form.Item
                  label="Full Name"
                  name="name"
                  rules={[
                    { required: true, message: "Please enter full name" },
                    { min: 2, message: "Full name must be at least 2 characters" },
                    { max: 100, message: "Full name must not exceed 100 characters" }
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Phone Number"
                  name="phone"
                  rules={[
                    { pattern: /^[0-9]{10}$/, message: "Invalid phone number!" }
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Enter phone number" />
                </Form.Item>

                <Form.Item
                  label="Date of Birth"
                  name="birth_date"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="Select date of birth"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>

                <Form.Item
                  label="Gender"
                  name="gender"
                >
                  <Select placeholder="Select gender">
                    <Select.Option value="male">Male</Select.Option>
                    <Select.Option value="female">Female</Select.Option>
                    <Select.Option value="other">Other</Select.Option>
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
                      Change
                    </Button>
                  </div>
                </Form.Item>

                <Modal
                  title="Change Email Address"
                  open={isChangeEmailModalOpen}
                  onCancel={() => setIsChangeEmailModalOpen(false)}
                  footer={null}
                >
                  <div className="flex flex-col gap-4 py-4">
                    {!emailVerificationSent ? (
                      <>
                        <p className="text-gray-600">
                          Please enter new email and current password to confirm the change.
                        </p>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
                          <Input
                            placeholder="Enter new email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <Input.Password
                            placeholder="Enter password to confirm"
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
                          Send Confirmation
                        </Button>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-700">
                            ✅ Verification email sent to <strong>{newEmail}</strong>
                          </p>
                        </div>
                        <p className="text-gray-600 mb-4">
                          Please check your inbox and click the verification link to complete email change.
                        </p>
                        <Button onClick={() => setIsChangeEmailModalOpen(false)}>
                          Close
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
                    Update
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

