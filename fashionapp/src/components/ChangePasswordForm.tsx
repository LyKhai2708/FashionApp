import { Form, Input, Button, message, Typography } from "antd"
import { LockOutlined } from "@ant-design/icons"

export default function ChangePasswordForm() {
  const [form] = Form.useForm()

  const handleFinish = (values: any) => {
    console.log("Change password values:", values)
    message.success("Đổi mật khẩu thành công!")
    form.resetFields()
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
          name="oldPassword"
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
            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }
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
          >
            Cập nhật mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
