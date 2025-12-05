import { Card, Form, Input, Button, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useMessage } from '../App';
import authService from '../services/authService';

export default function ForgotPassword() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const message = useMessage();
    const navigate = useNavigate();

    const handleFinish = async (values: { email: string }) => {
        setLoading(true);
        try {
            await authService.forgotPassword(values.email);
            setEmailSent(true);
            message.success('Password reset email sent. Please check your inbox.');
        } catch (error: any) {
            message.error(error.message || 'An error occurred. Please try again later.');
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

                    {!emailSent ? (
                        <>
                            <Typography.Title level={3} className="text-center mb-2">
                                Forgot password?
                            </Typography.Title>
                            <Typography.Paragraph className="text-center text-gray-600 mb-6">
                                Enter your email address and we'll send you a link to reset your password.
                            </Typography.Paragraph>

                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleFinish}
                                requiredMark={false}
                            >
                                <Form.Item
                                    label="Email"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Please enter your email' },
                                        { type: 'email', message: 'Invalid email format' },
                                        { max: 100, message: 'Email must not exceed 100 characters' }
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="your.email@example.com"
                                        prefix={<MailOutlined />}
                                        autoComplete="email"
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
                                        Send reset link
                                    </Button>
                                </Form.Item>
                            </Form>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="mb-4">
                                <svg
                                    className="mx-auto h-16 w-16 text-green-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <Typography.Title level={4} className="mb-2">
                                Email sent!
                            </Typography.Title>
                            <Typography.Paragraph className="text-gray-600 mb-6">
                                We've sent a password reset link to your email.
                                Please check your inbox (including spam folder) and follow the instructions.
                            </Typography.Paragraph>
                            <Typography.Paragraph className="text-sm text-gray-500 mb-6">
                                Link expires in 15 minutes.
                            </Typography.Paragraph>
                            <Button
                                size="large"
                                onClick={() => navigate('/login')}
                                block
                            >
                                Back to login
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
