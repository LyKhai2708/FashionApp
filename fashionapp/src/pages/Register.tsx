import { useState } from "react";
import { Card, Form, Input, Typography, Divider, Row, Col, Button} from "antd";
import { Link } from "react-router-dom";
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined} from "@ant-design/icons";
import { Home } from "lucide-react";
import { useMessage } from '../App'
import { useEffect } from "react";
import otpService from "../services/otpService";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
export default function Register() {
  const [form] = Form.useForm();
  const [otpSent, setOtpSent] = useState(false);
  const message = useMessage()
  const [loading, setLoading] = useState(false);
  const [currentPhone, setCurrentPhone] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    }
  }, [countdown]);
  const handleFinish = async (values: any) => {
    try {
      if (!phoneVerified) {
        message.error('Vui lòng xác thực số điện thoại trước');
        return;
      }

      setLoading(true);
      const response = await register({
        username: values.username,
        email: values.email,
        password: values.password,
        phone: currentPhone
      });

      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      message.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {

      const phone = form.getFieldValue('phone');
            
      if (!phone) {
        message.error('Vui lòng nhập số điện thoại');
        return;
      }

      setLoading(true);
      await otpService.sendOtp(phone);
            
      setOtpSent(true);
      setCurrentPhone(phone);
      setCountdown(60);
      message.success('OTP đã được gửi đến số điện thoại của bạn');
    } catch (err: any) {
      message.error(err.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  }
  const handleVerifyOtp = async () => {
    try {
      const otp = form.getFieldValue('otp');

      if (!otp) {
        message.error('Vui lòng nhập mã OTP');
        return;
      }
      setLoading(true);
      await otpService.verifyOtp(currentPhone, otp);
      setPhoneVerified(true);
      setOtpSent(false);
      message.success('Xác thực thành công!');

    } catch (err: any) {
      message.error(err.message || 'Xác thực thất bại');
    }finally {
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
          {/* Bên trái (ảnh) */}
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

          {/* Bên phải (form) */}
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
                <div className="flex gap-2 flex-col md:flex-row">
                  <Form.Item
                    className="flex-1"
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
                    className="flex-1"
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
                    />
                  </Form.Item>
                </div>

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

                <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại' },
                            { pattern: /^(0)[0-9]{9,10}$/, message: 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0)' }
                        ]}
                    >
                        <Input 
                            prefix={<PhoneOutlined />} 
                            placeholder="Nhập số điện thoại"
                            size="large"
                            disabled={phoneVerified}
                            suffix={
                                phoneVerified ? (
                                    <span className="text-green-500">✓ Đã xác thực</span>
                                ) : (
                                    <Button 
                                        type="link" 
                                        onClick={handleSendOtp}
                                        loading={loading}
                                        disabled={countdown > 0}
                                    >
                                        {countdown > 0 ? `${countdown}s` : 'Gửi OTP'}
                                    </Button>
                                )
                            }
                        />
                    </Form.Item>

                    {/* OTP Input - Hiện khi đã gửi OTP */}
                    {otpSent && !phoneVerified && (
                        <Form.Item
                            name="otp"
                            label="Mã OTP"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mã OTP' },
                                { len: 6, message: 'OTP phải có 6 số' }
                            ]}
                        >
                            <Input 
                                placeholder="Nhập mã OTP 6 số"
                                size="large"
                                maxLength={6}
                                suffix={
                                    <Button 
                                        type="primary" 
                                        onClick={handleVerifyOtp}
                                        loading={loading}
                                    >
                                        Xác thực
                                    </Button>
                                }
                            />
                        </Form.Item>
                  )}

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={loading}
                            disabled={!phoneVerified}
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
