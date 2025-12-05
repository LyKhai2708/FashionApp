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
            title={isEditing ? 'Edit Supplier' : 'Add New Supplier'}
            open={isOpen}
            onCancel={handleCancel}
            onOk={() => form.submit()}
            okText={isEditing ? 'Update' : 'Add'}
            cancelText="Cancel"
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
                    label="Supplier Name"
                    rules={[
                        { required: true, message: 'Please enter supplier name' },
                        { min: 2, message: 'Name must have at least 2 characters' },
                        { max: 255, message: 'Name cannot exceed 255 characters' }
                    ]}
                >
                    <Input placeholder="Enter supplier name" />
                </Form.Item>

                <Form.Item
                    name="contact_name"
                    label="Contact Person"
                    rules={[
                        { max: 255, message: 'Contact name cannot exceed 255 characters' }
                    ]}
                >
                    <Input placeholder="Contact person name" />
                </Form.Item>

                <Form.Item
                    name="tax_code"
                    label="Tax Code"
                    rules={[
                        { pattern: /^[0-9-]*$/, message: 'Tax code can only contain numbers and hyphens' },
                        { max: 50, message: 'Tax code cannot exceed 50 characters' }
                    ]}
                >
                    <Input placeholder="Tax code" />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { type: 'email', message: 'Invalid email' },
                        { max: 255, message: 'Email cannot exceed 255 characters' }
                    ]}
                >
                    <Input placeholder="Contact email" />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[
                        { pattern: /^[0-9+\-() ]*$/, message: 'Invalid phone number' },
                        { min: 10, message: 'Phone number must have at least 10 digits' },
                        { max: 20, message: 'Phone number cannot exceed 20 characters' }
                    ]}
                >
                    <Input placeholder="Phone number" />
                </Form.Item>

                <Form.Item
                    name="address"
                    label="Address"
                    rules={[
                        { max: 500, message: 'Address cannot exceed 500 characters' }
                    ]}
                >
                    <Input.TextArea rows={3} placeholder="Supplier address" />
                </Form.Item>
            </Form>
        </Modal>
    );
}
