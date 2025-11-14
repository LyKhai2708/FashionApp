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
                            Link không hợp lệ
                        </Typography.Title>
                        <Typography.Paragraph className="text-gray-600 mb-6">
                            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                            Vui lòng yêu cầu link mới.
                        </Typography.Paragraph>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => navigate('/forgot-password')}
                            block
                            style={{ backgroundColor: '#000', borderColor: '#000' }}
                        >
                            Yêu cầu link mới
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
            message.success('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (error: any) {
            message.error(error.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
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
                            Quay lại đăng nhập
                        </Link>
                    </div>

                    <Typography.Title level={3} className="text-center mb-2">
                        Đặt lại mật khẩu
                    </Typography.Title>
                    <Typography.Paragraph className="text-center text-gray-600 mb-6">
                        Nhập mật khẩu mới cho tài khoản của bạn.
                    </Typography.Paragraph>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            label="Mật khẩu mới"
                            name="password"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                                { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                                { max: 50, message: 'Mật khẩu không được vượt quá 50 ký tự' },
                                {
                                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                                    message: 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa, một chữ cái viết thường, một số và một ký tự đặc biệt'
                                }
                            ]}
                            hasFeedback
                        >
                            <Input.Password
                                size="large"
                                placeholder="Nhập mật khẩu mới"
                                prefix={<LockOutlined />}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Xác nhận mật khẩu"
                            name="confirmPassword"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                size="large"
                                placeholder="Nhập lại mật khẩu mới"
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
                                Đặt lại mật khẩu
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Card>
        </div>
    );
}
