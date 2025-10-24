
import { useState, useEffect } from 'react';
import { useMessage } from '../../App';
import sizeService from '../../services/sizeService';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, Form, Input } from 'antd';

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
            message.error('Không thể xóa');
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý kích cỡ</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Thêm size
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">Tổng: {sizes.length} kích cỡ</h3>
                
                {loading ? (
                    <div className="text-center py-8">Đang tải...</div>
                ) : (
                    <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-3">
                        {sizes.map((size) => (
                            <div key={size.size_id} className="border rounded-lg p-3 text-center hover:shadow-md transition-shadow">
                                <div className="font-bold text-lg mb-2">{size.name}</div>
                                <div className="flex justify-center gap-1">
                                    <button 
                                        onClick={() => handleDelete(size.size_id)}
                                        className="text-red-600 hover:text-red-800 p-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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

                    <div className="text-sm text-gray-500 mt-2">
                        <p>Gợi ý:</p>
                        <ul className="list-disc ml-5 mt-1">
                            <li>Quần áo: S, M, L, XL, XXL, 3XL</li>
                            <li>Giày dép: 35, 36, 37, 38, 39, 40...</li>
                            <li>Size số: 1, 2, 3...</li>
                        </ul>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}