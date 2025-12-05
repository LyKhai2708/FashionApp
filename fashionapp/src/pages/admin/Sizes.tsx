import { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, Popconfirm, Statistic, Row, Col, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, ColumnHeightOutlined } from '@ant-design/icons';
import { useMessage } from '../../App';
import sizeService from '../../services/sizeService';
import { PermissionGate } from '../../components/PermissionGate';

interface Size {
    size_id: number;
    name: string;
}

export default function Sizes() {
    const message = useMessage();
    const [sizes, setSizes] = useState<Size[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const fetchSizes = async () => {
        try {
            const response = await sizeService.getSizes();
            setSizes(response || []);
        } catch (error: any) {
            message.error('Cannot load sizes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSizes();
    }, []);

    const handleDelete = async (sizeId: number) => {
        if (!window.confirm('Are you sure you want to delete this size?')) return;
        try {
            await sizeService.deleteSize(sizeId);
            message.success('Deleted successfully');
            fetchSizes();
        } catch (error: any) {
            message.error(error.message || 'Cannot delete');
        }
    };

    const handleCreate = async (values: { name: string }) => {
        try {
            setSubmitting(true);
            await sizeService.createSize(values);
            message.success('Size added successfully');
            setIsModalOpen(false);
            form.resetFields();
            fetchSizes();
        } catch (error: any) {
            message.error(error.message || 'Cannot add size');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                    <ColumnHeightOutlined /> Size Management
                </h1>
                <PermissionGate permission="sizes.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        size="large"
                    >
                        Add Size
                    </Button>
                </PermissionGate>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <Card>
                        <Statistic
                            title="Total Sizes"
                            value={sizes.length}
                            prefix={<ColumnHeightOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Size List" loading={loading}>
                <Row gutter={[12, 12]}>
                    {sizes.map((size) => (
                        <Col key={size.size_id} xs={6} sm={4} md={3} lg={2}>
                            <Card
                                size="small"
                                hoverable
                                style={{ textAlign: 'center' }}
                                bodyStyle={{ padding: '12px 8px' }}
                            >
                                <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{size.name}</div>
                                <PermissionGate permission="sizes.delete">
                                    <Popconfirm
                                        title="Delete size?"
                                        description="Are you sure you want to delete this size?"
                                        onConfirm={() => handleDelete(size.size_id)}
                                        okText="Delete"
                                        cancelText="Cancel"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            style={{ fontSize: 12 }}
                                        />
                                    </Popconfirm>
                                </PermissionGate>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>

            <Modal
                title="Add New Size"
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                confirmLoading={submitting}
                okText="Add"
                cancelText="Cancel"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                >
                    <Form.Item
                        label="Size Name"
                        name="name"
                        rules={[
                            { required: true, message: 'Please enter size name' },
                            { max: 10, message: 'Size name max 10 characters' }
                        ]}
                    >
                        <Input
                            placeholder="e.g: S, M, L, XL, XXL, 39, 40..."
                            maxLength={10}
                        />
                    </Form.Item>

                    <Alert
                        message="Size Suggestions"
                        description={
                            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                                <li>Clothing: S, M, L, XL, XXL, 3XL</li>
                                <li>Footwear: 35, 36, 37, 38, 39, 40...</li>
                                <li>Numeric: 1, 2, 3...</li>
                            </ul>
                        }
                        type="info"
                        showIcon
                        style={{ marginTop: 16 }}
                    />
                </Form>
            </Modal>
        </div>
    );
}