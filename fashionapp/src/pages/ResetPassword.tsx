import { Card, Form, Input, Button, Typography } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useMessage } from '../App';
import authService from '../services/authService';

export default function ResetPassword() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const message = useMessage();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
                <Card className="w-full max-w-md shadow-lg" bordered style={{ borderRadius: 16 }}>
                    <div className="p-6 text-center">
                        <Typography.Title level={4} className="text-red-500 mb-4">
                            Invalid link
                        </Typography.Title>
                        <Typography.Paragraph className="text-gray-600 mb-6">
                            Password reset link is invalid or has expired.
                            Please request a new link.
                        </Typography.Paragraph>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => navigate('/forgot-password')}
                            block
                            style={{ backgroundColor: '#000', borderColor: '#000' }}
                        >
                            Request new link
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const handleFinish = async (values: { password: string }) => {
        setLoading(true);
        try {
            await authService.resetPassword(token, values.password);
            message.success('Password reset successful! You can login now.');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (error: any) {
            message.error(error.message || 'Password reset failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
            <Card className="w-full max-w-md shadow-lg" bordered style={{ borderRadius: 16 }}>
                <div className="p-6">
                    <div className="flex justify-start mb-4">
                        <Link
                            to="/login"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                        >
                            <ArrowLeftOutlined />
                            Back to login
                        </Link>
                    </div>

                    <Typography.Title level={3} className="text-center mb-2">
                        Reset password
                    </Typography.Title>
                    <Typography.Paragraph className="text-center text-gray-600 mb-6">
                        Enter a new password for your account.
                    </Typography.Paragraph>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            label="New password"
                            name="password"
                            rules={[
                                { required: true, message: 'Please enter new password' },
                                { min: 8, message: 'Password must be at least 8 characters' },
                                { max: 50, message: 'Password must not exceed 50 characters' },
                                {
                                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                                    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
                                }
                            ]}
                            hasFeedback
                        >
                            <Input.Password
                                size="large"
                                placeholder="Enter new password"
                                prefix={<LockOutlined />}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Confirm password"
                            name="confirmPassword"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                { required: true, message: 'Please confirm your password' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Passwords do not match!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                size="large"
                                placeholder="Re-enter new password"
                                prefix={<LockOutlined />}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={loading}
                                block
                                style={{
                                    backgroundColor: '#000',
                                    borderColor: '#000',
                                    height: 48
                                }}
                            >
                                Reset password
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Card>
        </div>
    );
}
