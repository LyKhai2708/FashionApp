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
      message.success('Password changed successfully');
      form.resetFields();
    } catch (error: any) {
      console.log('Change password error:', error);
      message.error(error.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Typography.Title level={4}>Change Password</Typography.Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
      >
        <Form.Item
          label="Current Password"
          name="currentPassword"
          rules={[{ required: true, message: "Please enter current password" }]}
        >
          <Input.Password
            size="large"
            placeholder="Enter current password"
            prefix={<LockOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[
            { required: true, message: "Please enter new password" },
            { min: 8, message: "Password must be at least 8 characters" },
            { max: 50, message: "Password must not exceed 50 characters" }
          ]}
        >
          <Input.Password
            size="large"
            placeholder="Enter new password"
            prefix={<LockOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm new password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error("Password confirmation does not match!"))
              },
            }),
          ]}
        >
          <Input.Password
            size="large"
            placeholder="Confirm password"
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
            Update Password
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
