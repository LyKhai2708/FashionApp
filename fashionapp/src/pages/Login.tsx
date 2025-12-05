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
            message.success('Login successful!')
            navigate('/')
        } catch (error: any) {
            if (error.message === 'GOOGLE_ONLY_ACCOUNT') {
                message.warning('This email was registered with Google. Please use the "Sign in with Google" button below!')
            } else {
                message.error(error.message || 'Login failed!')
            }
        }
    }

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        try {
            if (!credentialResponse.credential) {
                message.error('Could not receive information from Google')
                return
            }
            await googleLogin(credentialResponse.credential)
            message.success('Google login successful!')
            navigate('/')
        } catch (error: any) {
            message.error(error.message || 'Google login failed!')
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
                                WELCOME TO DELULU
                            </Typography.Title>
                            <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 420 }}>
                                Pure, full of emotion - It's not just about the designs, but also about the feelings of those who wear them.
                            </Typography.Paragraph>
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div className="p-6 md:p-10">
                            <div className="flex justify-start">
                                <Link to="/" aria-label="Go to homepage" className="p-2 rounded-full border text-gray-700 hover:bg-gray-50">
                                    <Home size={18} />
                                </Link>
                            </div>
                            <h2 className="text-2xl font-semibold mb-6 text-center">LOGIN</h2>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleFinish}
                                requiredMark={false}
                            >
                                <Form.Item
                                    label="Email / Phone number"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Please enter email or phone number' },
                                        { max: 100, message: 'Must not exceed 100 characters' }
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="Enter email or phone number"
                                        prefix={<MailOutlined />}
                                        autoComplete="username"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Password"
                                    name="password"
                                    rules={[
                                        { required: true, message: 'Please enter password' },
                                        { min: 6, message: 'Password must be at least 6 characters' },
                                        { max: 50, message: 'Password must not exceed 50 characters' }
                                    ]}
                                >
                                    <Input.Password
                                        size="large"
                                        placeholder="Enter password"
                                        prefix={<LockOutlined />}
                                        autoComplete="current-password"
                                    />
                                </Form.Item>

                                <div className="flex items-center justify-end mb-2">
                                    <Link to="/forgot-password" style={{ color: 'black' }}>
                                        Forgot password?
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

                                <Divider plain>or</Divider>

                                <div className="flex justify-center gap-3">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => message.error('Google login failed')}
                                        useOneTap={false}
                                        theme="outline"
                                        size="large"
                                        text="signin_with"
                                        width="300"
                                    />
                                </div>

                                <p className="text-center text-sm mt-4">
                                    Don't have an account?
                                    {' '}<Link to="/register" style={{
                                        color: '#1890ff',
                                        fontWeight: '500'
                                    }}>Register now</Link>
                                </p>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    )
}

