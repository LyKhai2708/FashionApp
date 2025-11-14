import { Card, Form, Input, Typography, Divider, Row, Col } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { Home } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMessage } from '../App'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'

export default function Login() {
    const [form] = Form.useForm()
    const { login, googleLogin, isLoading: authLoading } = useAuth()
    const message = useMessage()
    const navigate = useNavigate()

    const handleFinish = async (values: { email: string; password: string }) => {
        try {
            await login(values)
            message.success('Đăng nhập thành công!')
            navigate('/')
        } catch (error: any) {
            if (error.message === 'GOOGLE_ONLY_ACCOUNT') {
                message.warning('Email này đã đăng ký bằng Google. Vui lòng sử dụng nút "Đăng nhập với Google" bên dưới!')
            } else {
                message.error(error.message || 'Đăng nhập thất bại!')
            }
        }
    }

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        try {
            if (!credentialResponse.credential) {
                message.error('Không nhận được thông tin từ Google')
                return
            }
            await googleLogin(credentialResponse.credential)
            message.success('Đăng nhập Google thành công!')
            navigate('/')
        } catch (error: any) {
            message.error(error.message || 'Đăng nhập Google thất bại!')
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
                                    label="Email / Số điện thoại"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập email hoặc số điện thoại' },
                                        { max: 100, message: 'Không vượt quá 100 ký tự' }
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="Nhập email hoặc số điện thoại"
                                        prefix={<MailOutlined />}
                                        autoComplete="username"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Mật khẩu"
                                    name="password"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập mật khẩu' },
                                        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                                        { max: 50, message: 'Mật khẩu không vượt quá 50 ký tự' }
                                    ]}
                                >
                                    <Input.Password
                                        size="large"
                                        placeholder="Nhập mật khẩu"
                                        prefix={<LockOutlined />}
                                        autoComplete="current-password"
                                    />
                                </Form.Item>

                                <div className="flex items-center justify-end mb-2">
                                    <Link to="/forgot-password" style={{ color: 'black' }}>
                                        Quên mật khẩu?
                                    </Link>
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

                                <div className="flex justify-center gap-3">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => message.error('Đăng nhập Google thất bại')}
                                        useOneTap={false}
                                        theme="outline"
                                        size="large"
                                        text="signin_with"
                                        width="300"
                                    />
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

