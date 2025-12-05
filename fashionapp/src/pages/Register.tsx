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
        message.success('Email verified successfully!');

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
          message.success('Email verified! You can complete registration.');
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
        message.error('Please verify your email first');
        return;
      }

      setLoading(true);
      await register({
        username: values.username,
        email: currentEmail,
        password: values.password,
        phone: values.phone || null
      });

      message.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      message.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('Please enter your email');
        return;
      }

      setLoading(true);
      await emailVerificationService.sendVerificationRegister(email);
      setVerificationSent(true);
      setCurrentEmail(email);
      setCountdown(60);
      message.success('Verification email sent. Please check your inbox!');
    } catch (err: any) {
      message.error(err.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        message.error('Could not receive information from Google')
        return
      }
      await googleLogin(credentialResponse.credential)
      message.success('Google registration successful!')
      navigate('/')
    } catch (error: any) {
      message.error(error.message || 'Google registration failed!')
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
                JOIN DELULU
              </Typography.Title>
              <Typography.Paragraph
                style={{ color: "rgba(255,255,255,0.9)", maxWidth: 420 }}
              >
                Discover an inspiring world of fashion. Create an account to experience unique collections and the latest trends.
              </Typography.Paragraph>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div className="p-6 md:p-10">
              <div className="flex justify-start">
                <Link
                  to="/"
                  aria-label="Go to homepage"
                  className="p-2 rounded-full border text-gray-700 hover:bg-gray-50"
                >
                  <Home size={18} />
                </Link>
              </div>
              <h2 className="text-2xl font-semibold mb-6 text-center">
                REGISTER
              </h2>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                requiredMark={false}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Full name"
                    name="username"
                    rules={[
                      { required: true, message: "Please enter your full name" },
                      { min: 2, message: "Full name must be at least 2 characters" },
                      { max: 100, message: "Full name must not exceed 100 characters" }
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Enter full name"
                      prefix={<UserOutlined />}
                      autoComplete="username"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Please enter your email" },
                      { type: "email", message: "Invalid email format" },
                      { max: 100, message: "Email must not exceed 100 characters" }
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Enter email"
                      prefix={<MailOutlined />}
                      autoComplete="email"
                      disabled={emailVerified}
                      suffix={
                        emailVerified ? (
                          <span className="text-green-500 text-xs whitespace-nowrap">✓ Verified</span>
                        ) : (
                          <Button
                            type="link"
                            onClick={handleSendVerification}
                            loading={loading}
                            disabled={countdown > 0}
                            size="small"
                            className="!p-0"
                          >
                            {countdown > 0 ? `${countdown}s` : 'Verify'}
                          </Button>
                        )
                      }
                    />
                  </Form.Item>
                </div>

                {verificationSent && !emailVerified && (
                  <Alert
                    message="Verification email sent"
                    description={
                      <div>
                        Please check your email <strong>{currentEmail}</strong> and click the link to verify.
                        <br />
                        <small className="text-gray-500">Link is valid for 15 minutes</small>
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
                    label="Password"
                    name="password"
                    rules={[
                      { required: true, message: "Please enter password" },
                      { min: 6, message: "Password must be at least 6 characters" },
                      { max: 50, message: "Password must not exceed 50 characters" }
                    ]}
                  >
                    <Input.Password
                      size="large"
                      placeholder="Enter password"
                      prefix={<LockOutlined />}
                      autoComplete="new-password"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Confirm password"
                    name="confirmPassword"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "Please confirm your password" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Passwords do not match!")
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      size="large"
                      placeholder="Re-enter password"
                      prefix={<LockOutlined />}
                      autoComplete="new-password"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="phone"
                  label="Phone number"
                  rules={[
                    { pattern: /^(0)[0-9]{9,10}$/, message: 'Invalid phone number (must start with 0)' }
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Enter phone number"
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
                    Register
                  </Button>
                </Form.Item>

                <Divider plain>or</Divider>

                <div className="flex justify-center gap-3">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => message.error('Google registration failed')}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    width="300"
                  />
                </div>

                <p className="text-center text-sm mt-4">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    style={{
                      color: "#1890ff",
                      fontWeight: "500",
                    }}
                  >
                    Login now
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
