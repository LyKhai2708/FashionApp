import { Form, Input, Button, message, Typography } from "antd"
import { LockOutlined } from "@ant-design/icons"
import { useState } from "react"
import { useMessage } from '../App'
import { changePassword } from "../services/userService";
export default function ChangePasswordForm() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false);
  const message = useMessage();
  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      await changePassword(values.currentPassword, values.newPassword);
      message.success('Đổi mật khẩu thành công');
      form.resetFields();
    } catch (error: any) {
        console.log('Change password error:', error);
        message.error(error.message || 'Đổi mật khẩu thất bại');
    } finally {
        setLoading(false);
    }
  }

  return (
    <div>
      <Typography.Title level={4}>Đổi mật khẩu</Typography.Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
      >
        {/* Mật khẩu cũ */}
        <Form.Item
          label="Mật khẩu cũ"
          name="currentPassword"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}
        >
          <Input.Password
            size="large"
            placeholder="Nhập mật khẩu cũ"
            prefix={<LockOutlined />}
          />
        </Form.Item>

        {/* Mật khẩu mới */}
        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới" },
            { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" }
          ]}
        >
          <Input.Password
            size="large"
            placeholder="Nhập mật khẩu mới"
            prefix={<LockOutlined />}
          />
        </Form.Item>

        {/* Xác nhận mật khẩu */}
        <Form.Item
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"))
              },
            }),
          ]}
        >
          <Input.Password
            size="large"
            placeholder="Xác nhận mật khẩu"
            prefix={<LockOutlined />}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="!bg-black w-full"
            loading={loading}
            block
          >
            Cập nhật mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
