import { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import type { Supplier, CreateSupplierPayload } from '../../types/supplier';

interface SupplierModalProps {
    supplier: Supplier | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateSupplierPayload) => Promise<void>;
    isEditing: boolean;
}

export default function SupplierModal({ supplier, isOpen, onClose, onSubmit, isEditing }: SupplierModalProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (isOpen) {
            if (supplier) {
                form.setFieldsValue({
                    name: supplier.name,
                    contact_name: supplier.contact_name || '',
                    email: supplier.email || '',
                    phone: supplier.phone || '',
                    address: supplier.address || '',
                    tax_code: supplier.tax_code || ''
                });
            } else {
                form.resetFields();
            }
        }
    }, [supplier, isOpen, form]);

    const handleSubmit = async (values: CreateSupplierPayload) => {
        await onSubmit(values);
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title={isEditing ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
            open={isOpen}
            onCancel={handleCancel}
            onOk={() => form.submit()}
            okText={isEditing ? 'Cập nhật' : 'Thêm mới'}
            cancelText="Hủy"
            width={700}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
            >
                <Form.Item
                    name="name"
                    label="Tên nhà cung cấp"
                    rules={[
                        { required: true, message: 'Vui lòng nhập tên nhà cung cấp' },
                        { min: 2, message: 'Tên phải có ít nhất 2 ký tự' },
                        { max: 255, message: 'Tên không được quá 255 ký tự' }
                    ]}
                >
                    <Input placeholder="Nhập tên nhà cung cấp" />
                </Form.Item>

                <Form.Item
                    name="contact_name"
                    label="Người liên hệ"
                    rules={[
                        { max: 255, message: 'Tên người liên hệ không được quá 255 ký tự' }
                    ]}
                >
                    <Input placeholder="Tên người liên hệ" />
                </Form.Item>

                <Form.Item
                    name="tax_code"
                    label="Mã số thuế"
                    rules={[
                        { pattern: /^[0-9-]*$/, message: 'Mã số thuế chỉ được chứa số và dấu gạch ngang' },
                        { max: 50, message: 'Mã số thuế không được quá 50 ký tự' }
                    ]}
                >
                    <Input placeholder="Mã số thuế" />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { type: 'email', message: 'Email không hợp lệ' },
                        { max: 255, message: 'Email không được quá 255 ký tự' }
                    ]}
                >
                    <Input placeholder="Email liên hệ" />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                        { pattern: /^[0-9+\-() ]*$/, message: 'Số điện thoại không hợp lệ' },
                        { min: 10, message: 'Số điện thoại phải có ít nhất 10 số' },
                        { max: 20, message: 'Số điện thoại không được quá 20 ký tự' }
                    ]}
                >
                    <Input placeholder="Số điện thoại" />
                </Form.Item>

                <Form.Item
                    name="address"
                    label="Địa chỉ"
                    rules={[
                        { max: 500, message: 'Địa chỉ không được quá 500 ký tự' }
                    ]}
                >
                    <Input.TextArea rows={3} placeholder="Địa chỉ nhà cung cấp" />
                </Form.Item>
            </Form>
        </Modal>
    );
}
