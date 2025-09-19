import { useState } from "react";
import { Card, Form, Input, Typography, Divider, Row, Col } from "antd";
import { Link } from "react-router-dom";
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Home } from "lucide-react";

export default function Register() {
  const [form] = Form.useForm();
  const [otpSent, setOtpSent] = useState(false);

  const handleFinish = (values: any) => {
    console.log("Register values:", values);
    // Xử lý đăng ký ở đây
  };

  const handleSendOtp = async () => {
    try {
      //kiem tra so dien thoai
      await form.validateFields(["phone"]);
      console.log("sdt hợp lệ:", form.getFieldValue("phone"));
  
      // Nếu hợp lệ thì mới gửi OTP
      console.log("OTP sent to phone");
      setOtpSent(true);
    } catch (err) {
      console.log("SĐT chưa hợp lệ:", err);
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
                    name="name"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ và tên" },
                      { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự" },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Nhập họ và tên"
                      prefix={<UserOutlined />}
                      autoComplete="name"
                    />
                  </Form.Item>

                  <Form.Item
                    className="flex-1"
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email" },
                      { type: "email", message: "Email không hợp lệ" },
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
                    placeholder="Xác nhận mật khẩu"
                    prefix={<LockOutlined />}
                    autoComplete="new-password"
                  />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                    {
                      pattern: /^[0-9]{9,11}$/,
                      message: "Số điện thoại không hợp lệ",
                    },
                  ]}
                >
                  <div className="flex gap-2">
                    <Input
                      size="large"
                      placeholder="Nhập số điện thoại"
                      prefix={<PhoneOutlined />}
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="w-20 h-10 rounded-md bg-black text-white text-sm hover:opacity-90 transition"
                    >
                      Gửi OTP
                    </button>
                  </div>
                </Form.Item>

                {otpSent && (
                  <Form.Item
                    label="Mã OTP"
                    name="otp"
                    rules={[
                      { required: true, message: "Vui lòng nhập mã OTP" },
                      {
                        len: 6,
                        message: "OTP phải gồm 6 ký tự",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Nhập mã OTP"
                      prefix={<SafetyCertificateOutlined />}
                    />
                  </Form.Item>
                )}

                <button
                  type="submit"
                  className="w-full h-11 rounded-full bg-black text-white font-medium shadow-lg hover:opacity-95 transition"
                >
                  ĐĂNG KÝ
                </button>

                <Divider plain>hoặc</Divider>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="cursor-pointer h-12 w-12 mx-auto rounded-full border-2 border-[#1877F2] flex items-center justify-center bg-white hover:bg-[#1877F20D] transition-transform duration-200 hover:scale-105 shadow-sm"
                    aria-label="Register with Facebook"
                    title="Đăng ký bằng Facebook"
                  >
                    {/* Facebook icon */}
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="#1877F2"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.406.593 24 1.325 24H12.82v-9.294H9.692V11.07h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.794.143v3.24h-1.918c-1.504 0-1.796.715-1.796 1.764v2.312h3.59l-.467 3.636h-3.123V24h6.123C23.406 24 24 23.406 24 22.676V1.325C24 .593 23.406 0 22.675 0z" />
                    </svg>
                  </button>
                  <button
                    className="cursor-pointer h-12 w-12 mx-auto rounded-full border-2 border-[#4285F4] flex items-center justify-center bg-white hover:bg-[#4285F40D] transition-transform duration-200 hover:scale-105 shadow-sm"
                    aria-label="Register with Google"
                    title="Đăng ký bằng Google"
                  >
                    {/* Google icon */}
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        fill="#FFC107"
                        d="M43.611 20.083H42V20H24v8h11.303C33.873 31.659 29.327 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C33.64 5.149 28.991 3 24 3 16.318 3 9.656 7.337 6.306 14.691z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C33.64 5.149 28.991 3 24 3 16.318 3 9.656 7.337 6.306 14.691z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24 43c5.243 0 10.036-2.005 13.63-5.27l-6.29-5.324C29.329 33.658 26.805 35 24 35c-5.304 0-9.833-3.321-11.289-7.946l-6.54 5.036C9.474 38.556 16.228 43 24 43z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.611 20.083H42V20H24v8h11.303c-1.091 3.176-3.605 5.717-6.663 6.805.001-.001 6.29 5.324 6.29 5.324l.434.032C39.79 36.651 44 30.904 44 23c0-1.341-.138-2.651-.389-3.917z"
                      />
                    </svg>
                  </button>
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
