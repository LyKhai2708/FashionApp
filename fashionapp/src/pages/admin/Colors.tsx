import { useState, useEffect } from 'react';
import { useMessage } from '../../App';
import colorService from '../../services/colorService';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, Form, Input } from 'antd';

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
            message.error('Không thể xóa');
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý màu sắc</h1>
                <button 
                    onClick={() => {
                        setIsModalOpen(true);
                        setPreviewColor('#000000');
                        form.setFieldValue('hex_code', '#000000');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Thêm màu
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">Tổng: {colors.length} màu</h3>
                
                {loading ? (
                    <div className="text-center py-8">Đang tải...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {colors.map((color) => (
                            <div key={color.color_id} className="border rounded-lg p-4 text-center">
                                <div 
                                    className="w-16 h-16 rounded-full mx-auto mb-2 border"
                                    style={{ backgroundColor: color.hex_code }}
                                ></div>
                                <div className="font-medium">{color.name}</div>
                                <div className="text-xs text-gray-500 mb-2">{color.hex_code}</div>
                                <div className="flex justify-center gap-2">
                                    <button 
                                        onClick={() => handleDelete(color.color_id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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