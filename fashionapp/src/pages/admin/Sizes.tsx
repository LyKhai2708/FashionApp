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
            message.error('Không thể tải danh sách kích cỡ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSizes();
    }, []);

    const handleDelete = async (sizeId: number) => {
        if (!window.confirm('Xác nhận xóa kích cỡ này?')) return;
        try {
            await sizeService.deleteSize(sizeId);
            message.success('Xóa thành công');
            fetchSizes();
        } catch (error: any) {
            message.error(error.message || 'Không thể xóa');
        }
    };

    const handleCreate = async (values: { name: string }) => {
        try {
            setSubmitting(true);
            await sizeService.createSize(values);
            message.success('Thêm size thành công');
            setIsModalOpen(false);
            form.resetFields();
            fetchSizes();
        } catch (error: any) {
            message.error(error.message || 'Không thể thêm size');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                    <ColumnHeightOutlined /> Quản lý kích cỡ
                </h1>
                <PermissionGate permission="sizes.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        size="large"
                    >
                        Thêm size
                    </Button>
                </PermissionGate>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <Card>
                        <Statistic
                            title="Tổng kích cỡ"
                            value={sizes.length}
                            prefix={<ColumnHeightOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Danh sách kích cỡ" loading={loading}>
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
                                        title="Xóa kích cỡ?"
                                        description="Bạn có chắc muốn xóa size này?"
                                        onConfirm={() => handleDelete(size.size_id)}
                                        okText="Xóa"
                                        cancelText="Hủy"
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
                title="Thêm size mới"
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                confirmLoading={submitting}
                okText="Thêm"
                cancelText="Hủy"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                >
                    <Form.Item
                        label="Tên size"
                        name="name"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên size' },
                            { max: 10, message: 'Tên size không quá 10 ký tự' }
                        ]}
                    >
                        <Input
                            placeholder="VD: S, M, L, XL, XXL, 39, 40..."
                            maxLength={10}
                        />
                    </Form.Item>

                    <Alert
                        message="Gợi ý size"
                        description={
                            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                                <li>Quần áo: S, M, L, XL, XXL, 3XL</li>
                                <li>Giày dép: 35, 36, 37, 38, 39, 40...</li>
                                <li>Size số: 1, 2, 3...</li>
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