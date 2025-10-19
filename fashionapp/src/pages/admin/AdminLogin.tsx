import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAdminAuth } from '../../contexts/admin/AdminAuthContext';
import { useMessage } from '../../App';
const { Title, Text } = Typography;

interface LoginFormValues {
    email: string;
    password: string;
}

const AdminLogin: React.FC = () => {
    const [form] = Form.useForm();
    const { isAuthenticated, isLoading, error, login, clearError } = useAdminAuth();
    const navigate = useNavigate();
    const message = useMessage();
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/admin/dashboard');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                clearError();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, clearError]);

    const handleSubmit = async (values: LoginFormValues) => {
        try {
            await login(values);
        } catch (error: any) {
            const errorMessage = error.message || 'Đăng nhập thất bại';
            message.error(errorMessage);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Card 
                className="w-full max-w-md shadow-2xl"
                bordered={false}
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <LoginOutlined className="text-3xl text-blue-600" />
                    </div>
                    <Title level={2} className="mb-2">
                        Delulu Admin Panel
                    </Title>
                    <Text type="secondary">
                        Đăng nhập để quản lý hệ thống
                    </Text>
                </div>
                <Form
                    form={form}
                    name="admin_login"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    size="large"
                    layout="vertical"
                    disabled={isLoading}
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-gray-400" />}
                            placeholder="Email"
                            autoComplete="email"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Mật khẩu"
                            autoComplete="current-password"
                        />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isLoading}
                            block
                            size="large"
                            icon={<LoginOutlined />}
                        >
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </Button>
                    </Form.Item>
                </Form>

                <div className="mt-6 text-center">
                    <Text type="secondary" className="text-xs">
                        2025 DELULU. All rights reserved.
                    </Text>
                </div>
            </Card>
        </div>
    );
};

export default AdminLogin;