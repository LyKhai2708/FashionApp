import { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, Popconfirm, Space, Statistic, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, BgColorsOutlined } from '@ant-design/icons';
import { useMessage } from '../../App';
import colorService from '../../services/colorService';
import { PermissionGate } from '../../components/PermissionGate';

interface Color {
    color_id: number;
    name: string;
    hex_code: string;
}

export default function Colors() {
    const message = useMessage();
    const [colors, setColors] = useState<Color[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [previewColor, setPreviewColor] = useState('#000000');

    const fetchColors = async () => {
        try {
            const response = await colorService.getColors();
            setColors(response || []);
        } catch (error: any) {
            message.error('Không thể tải danh sách màu sắc');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColors();
    }, []);

    const handleDelete = async (colorId: number) => {
        if (!window.confirm('Xác nhận xóa màu sắc này?')) return;
        try {
            await colorService.deleteColor(colorId);
            message.success('Xóa thành công');
            fetchColors();
        } catch (error: any) {
            message.error(error.message || 'Không thể xóa');
        }
    };

    const handleCreate = async (values: { name: string; hex_code: string }) => {
        try {
            setSubmitting(true);
            await colorService.createColor(values);
            message.success('Thêm màu thành công');
            setIsModalOpen(false);
            form.resetFields();
            fetchColors();
        } catch (error: any) {
            message.error(error.message || 'Không thể thêm màu');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                    <BgColorsOutlined /> Quản lý màu sắc
                </h1>
                <PermissionGate permission="colors.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setIsModalOpen(true);
                            setPreviewColor('#000000');
                            form.setFieldValue('hex_code', '#000000');
                        }}
                        size="large"
                    >
                        Thêm màu
                    </Button>
                </PermissionGate>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <Card>
                        <Statistic
                            title="Tổng màu sắc"
                            value={colors.length}
                            prefix={<BgColorsOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Danh sách màu sắc" loading={loading}>
                <Row gutter={[16, 16]}>
                    {colors.map((color) => (
                        <Col key={color.color_id} xs={12} sm={8} md={6} lg={4}>
                            <Card
                                size="small"
                                hoverable
                                style={{ textAlign: 'center' }}
                            >
                                <div
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: '50%',
                                        margin: '0 auto 12px',
                                        backgroundColor: color.hex_code,
                                        border: '2px solid #e8e8e8',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <div style={{ fontWeight: 500, marginBottom: 4 }}>{color.name}</div>
                                <div style={{ fontSize: 12, color: '#999', marginBottom: 8, fontFamily: 'monospace' }}>{color.hex_code}</div>
                                <PermissionGate permission="colors.delete">
                                    <Popconfirm
                                        title="Xóa màu sắc?"
                                        description="Bạn có chắc muốn xóa màu này?"
                                        onConfirm={() => handleDelete(color.color_id)}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                        >
                                            Xóa
                                        </Button>
                                    </Popconfirm>
                                </PermissionGate>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>

            <Modal
                title="Thêm màu mới"
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                    setPreviewColor('#000000');
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
                    initialValues={{ hex_code: '#000000' }}
                >
                    <Form.Item
                        label="Tên màu"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên màu' }]}
                    >
                        <Input placeholder="VD: Đỏ, Xanh dương..." />
                    </Form.Item>

                    <Form.Item
                        label="Mã màu (Hex)"
                        name="hex_code"
                        rules={[
                            { required: true, message: 'Vui lòng chọn màu' },
                            { pattern: /^#[0-9A-F]{6}$/i, message: 'Mã màu không hợp lệ (VD: #FF0000)' }
                        ]}
                    >
                        <div className="flex gap-2">
                            <Input
                                placeholder="#000000"
                                value={previewColor}
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    setPreviewColor(value);
                                    form.setFieldValue('hex_code', value);
                                }}
                            />
                            <input
                                type="color"
                                value={previewColor}
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    setPreviewColor(value);
                                    form.setFieldValue('hex_code', value);
                                }}
                                className="w-16 h-10 border rounded cursor-pointer"
                            />
                        </div>
                    </Form.Item>

                    <div className="text-center">
                        <div
                            className="w-24 h-24 rounded-full mx-auto border-2 shadow-lg"
                            style={{ backgroundColor: previewColor }}
                        />
                        <p className="text-sm text-gray-500 mt-2">Preview màu</p>
                        <p className="text-xs text-gray-400 mt-1 font-mono">{previewColor}</p>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}