import { Card, Form, Input, Typography, Divider, Row, Col } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { Home } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMessage } from '../App'

export default function Login() {
    const [form] = Form.useForm()
    const { login, isLoading: authLoading } = useAuth()
    const message = useMessage()
    const navigate = useNavigate()

    const handleFinish = async (values: { email: string; password: string }) => {
        console.log("err ", values);
        try {
            console.log("err ", values);
            await login(values)
            message.success('Đăng nhập thành công!')
            console.log('Đăng nhập thành công!', values)
            navigate('/')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Đăng nhập thất bại!')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <Card className="w-full max-w-5xl shadow-lg" bordered style={{ borderRadius: 16, overflow: 'hidden' }}>
                <Row gutter={0}>
                    <Col xs={0} md={12}>
                        <div
                            className="h-full hidden md:flex flex-col justify-center p-10 text-white"
                            style={{
                                minHeight: 420,
                                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(31,41,55,0.6) 50%, rgba(17,24,39,0.6) 100%), url(/login-pic.jpg)`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <Typography.Title level={2} style={{ color: 'white', marginBottom: 16 }}>
                                CHÀO MỪNG TỚI VỚI DELULU
                            </Typography.Title>
                            <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 420 }}>
                                Tinh khiết, tràn trề cảm xúc - Đó không chỉ là cảm nhận về các thiết kế, mà còn là về xúc cảm của người mặc chúng.
                            </Typography.Paragraph>
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div className="p-6 md:p-10">
                            <div className="flex justify-start">
                                <Link to="/" aria-label="Về trang chủ" className="p-2 rounded-full border text-gray-700 hover:bg-gray-50">
                                    <Home size={18} />
                                </Link>
                            </div>
                            <h2 className="text-2xl font-semibold mb-6 text-center">ĐĂNG NHẬP</h2>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleFinish}
                                requiredMark={false}
                            >
                                <Form.Item
                                    label="Email/Số điện thoại"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập email hoặc số điện thoại' }
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="Email hoặc số điện thoại"
                                        prefix={<MailOutlined />}
                                        autoComplete="username"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Mật khẩu"
                                    name="password"
                                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                                >
                                    <Input.Password
                                        size="large"
                                        placeholder="Nhập mật khẩu"
                                        prefix={<LockOutlined />}
                                        autoComplete="current-password"
                                    />
                                </Form.Item>

                                <div className="flex items-center justify-end mb-2">
                                    <a href="#">Quên mật khẩu</a>
                                </div>

                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="w-full h-11 rounded-full bg-black text-white font-medium shadow-lg hover:opacity-95 transition disabled:opacity-50"
                                >
                                    {authLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        </div>
                                    ) : (
                                        'LOGIN'
                                    )}
                                </button>

                                <Divider plain>hoặc</Divider>

                                <div className="grid grid-cols-2 gap-3">
                                    <button className="cursor-pointer h-12 w-12 mx-auto rounded-full border-2 border-[#1877F2] flex items-center justify-center bg-white hover:bg-[#1877F20D] transition-transform duration-200 hover:scale-105 shadow-sm" aria-label="Login with Facebook" title="Đăng nhập bằng Facebook">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.406.593 24 1.325 24H12.82v-9.294H9.692V11.07h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.794.143v3.24h-1.918c-1.504 0-1.796.715-1.796 1.764v2.312h3.59l-.467 3.636h-3.123V24h6.123C23.406 24 24 23.406 24 22.676V1.325C24 .593 23.406 0 22.675 0z"/>
                                        </svg>
                                    </button>
                                    <button className="cursor-pointer h-12 w-12 mx-auto rounded-full border-2 border-[#4285F4] flex items-center justify-center bg-white hover:bg-[#4285F40D] transition-transform duration-200 hover:scale-105 shadow-sm" aria-label="Login with Google" title="Đăng nhập bằng Google">
                                        <svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.873 31.659 29.327 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C33.64 5.149 28.991 3 24 3 16.318 3 9.656 7.337 6.306 14.691z"/>
                                            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C33.64 5.149 28.991 3 24 3 16.318 3 9.656 7.337 6.306 14.691z"/>
                                            <path fill="#4CAF50" d="M24 43c5.243 0 10.036-2.005 13.63-5.27l-6.29-5.324C29.329 33.658 26.805 35 24 35c-5.304 0-9.833-3.321-11.289-7.946l-6.54 5.036C9.474 38.556 16.228 43 24 43z"/>
                                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.091 3.176-3.605 5.717-6.663 6.805.001-.001 6.29 5.324 6.29 5.324l.434.032C39.79 36.651 44 30.904 44 23c0-1.341-.138-2.651-.389-3.917z"/>
                                        </svg>
                                    </button>
                                </div>

                                <p className="text-center text-sm mt-4">
                                    Chưa có tài khoản?
                                    {' '}<Link to="/register" style={{
                                        color: '#1890ff',
                                        fontWeight: '500'
                                    }}>Đăng ký ngay</Link>
                                </p>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    )
}

