import { useState, useEffect } from "react";
import { Card, Form, Input, Typography, Divider, Row, Col, Button, Alert } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined } from "@ant-design/icons";
import { Home } from "lucide-react";
import { useMessage } from '../App'
import emailVerificationService from "../services/emailVerificationService";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'

export default function Register() {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const [verificationSent, setVerificationSent] = useState(false);
  const message = useMessage()
  const [loading, setLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate();

  // Check for verified email from EmailVerification page
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlVerified = searchParams.get('verified');
    const storedEmail = localStorage.getItem('verified_email');
    const verifiedAt = localStorage.getItem('email_verified_at');

    if (urlEmail && urlVerified === 'true' && storedEmail === urlEmail) {
      // Verify timestamp is within last 5 minutes
      const fiveMinutes = 5 * 60 * 1000;
      if (verifiedAt && (Date.now() - parseInt(verifiedAt)) < fiveMinutes) {
        setEmailVerified(true);
        setCurrentEmail(urlEmail);
        form.setFieldValue('email', urlEmail);
        message.success('Email đã được xác thực thành công!');

        // Clean up localStorage
        localStorage.removeItem('verified_email');
        localStorage.removeItem('email_verified_at');
      }
    }
  }, [searchParams, form, message]);

  // Listen for cross-tab email verification (when user verifies in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Check if email was verified in another tab
      if (e.key === 'email_verified_at' && e.newValue) {
        const verifiedEmail = localStorage.getItem('verified_email');
        const formEmail = form.getFieldValue('email');

        // If the verified email matches current form email
        if (verifiedEmail && verifiedEmail === formEmail) {
          setEmailVerified(true);
          setCurrentEmail(verifiedEmail);
          setVerificationSent(false);
          setCountdown(0);
          message.success('Email đã được xác thực! Bạn có thể hoàn tất đăng ký.');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [form, message]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleFinish = async (values: any) => {
    try {
      if (!emailVerified) {
        message.error('Vui lòng xác thực email trước');
        return;
      }

      setLoading(true);
      await register({
        username: values.username,
        email: currentEmail,
        password: values.password,
        phone: values.phone || null
      });

      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      message.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('Vui lòng nhập email');
        return;
      }

      setLoading(true);
      await emailVerificationService.sendVerificationRegister(email);
      setVerificationSent(true);
      setCurrentEmail(email);
      setCountdown(60);
      message.success('Email xác nhận đã được gửi. Vui lòng kiểm tra hộp thư của bạn!');
    } catch (err: any) {
      message.error(err.message || 'Gửi email xác nhận thất bại');
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        message.error('Không nhận được thông tin từ Google')
        return
      }
      await googleLogin(credentialResponse.credential)
      message.success('Đăng ký Google thành công!')
      navigate('/')
    } catch (error: any) {
      message.error(error.message || 'Đăng ký Google thất bại!')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card
        className="w-full max-w-6xl shadow-lg"
        bordered
        style={{ borderRadius: 16, overflow: "hidden" }}
      >
        <Row gutter={0}>
          <Col xs={0} md={12}>
            <div
              className="h-full hidden md:flex flex-col justify-center p-10 text-white"
              style={{
                minHeight: 420,
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(31,41,55,0.6) 50%, rgba(17,24,39,0.6) 100%), url(/login-pic.jpg)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <Typography.Title
                level={2}
                style={{ color: "white", marginBottom: 16 }}
              >
                THAM GIA CÙNG DELULU
              </Typography.Title>
              <Typography.Paragraph
                style={{ color: "rgba(255,255,255,0.9)", maxWidth: 420 }}
              >
                Khám phá thế giới thời trang đầy cảm hứng. Tạo tài khoản để trải
                nghiệm những bộ sưu tập độc đáo và xu hướng mới nhất.
              </Typography.Paragraph>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div className="p-6 md:p-10">
              <div className="flex justify-start">
                <Link
                  to="/"
                  aria-label="Về trang chủ"
                  className="p-2 rounded-full border text-gray-700 hover:bg-gray-50"
                >
                  <Home size={18} />
                </Link>
              </div>
              <h2 className="text-2xl font-semibold mb-6 text-center">
                ĐĂNG KÝ
              </h2>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                requiredMark={false}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Họ và tên"
                    name="username"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ và tên" },
                      { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự" },
                      { max: 100, message: "Họ và tên không vượt quá 100 ký tự" }
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Nhập họ và tên"
                      prefix={<UserOutlined />}
                      autoComplete="username"
                    />
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
                    <Input
                      size="large"
                      placeholder="Nhập email"
                      prefix={<MailOutlined />}
                      autoComplete="email"
                      disabled={emailVerified}
                      suffix={
                        emailVerified ? (
                          <span className="text-green-500 text-xs whitespace-nowrap">✓ Đã xác thực</span>
                        ) : (
                          <Button
                            type="link"
                            onClick={handleSendVerification}
                            loading={loading}
                            disabled={countdown > 0}
                            size="small"
                            className="!p-0"
                          >
                            {countdown > 0 ? `${countdown}s` : 'Xác nhận'}
                          </Button>
                        )
                      }
                    />
                  </Form.Item>
                </div>

                {verificationSent && !emailVerified && (
                  <Alert
                    message="Email xác nhận đã được gửi"
                    description={
                      <div>
                        Vui lòng kiểm tra email <strong>{currentEmail}</strong> và click vào link để xác nhận.
                        <br />
                        <small className="text-gray-500">Link có hiệu lực trong 15 phút</small>
                      </div>
                    }
                    type="info"
                    showIcon
                    closable
                    className="mb-4"
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu" },
                      { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                      { max: 50, message: "Mật khẩu không vượt quá 50 ký tự" }
                    ]}
                  >
                    <Input.Password
                      size="large"
                      placeholder="Nhập mật khẩu"
                      prefix={<LockOutlined />}
                      autoComplete="new-password"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "Vui lòng xác nhận mật khẩu" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Mật khẩu xác nhận không khớp!")
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      size="large"
                      placeholder="Nhập lại mật khẩu"
                      prefix={<LockOutlined />}
                      autoComplete="new-password"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="phone"
                  label="Số điện thoại (tùy chọn)"
                  rules={[
                    { pattern: /^(0)[0-9]{9,10}$/, message: 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0)' }
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Nhập số điện thoại (không bắt buộc)"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={loading}
                    disabled={!emailVerified}
                    className="!bg-black !text-white hover:!bg-gray-800"
                  >
                    Đăng ký
                  </Button>
                </Form.Item>

                <Divider plain>hoặc</Divider>

                <div className="flex justify-center gap-3">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => message.error('Đăng ký Google thất bại')}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    width="300"
                  />
                </div>

                <p className="text-center text-sm mt-4">
                  Đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    style={{
                      color: "#1890ff",
                      fontWeight: "500",
                    }}
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </Form>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
