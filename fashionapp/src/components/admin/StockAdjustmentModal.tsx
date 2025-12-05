import { Modal, Form, InputNumber, Input, Select } from 'antd';
import { useState } from 'react';
import inventoryService from '../../services/inventoryService';
import { useMessage } from '../../App';

const { TextArea } = Input;

interface StockAdjustmentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    variant: {
        product_variants_id: number;
        product_name: string;
        size_name: string;
        color_name: string;
        stock_quantity: number;
    } | null;
}

export default function StockAdjustmentModal({ open, onClose, onSuccess, variant }: StockAdjustmentModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [quantityChange, setQuantityChange] = useState<number>(0);
    const message = useMessage();
    const handleSubmit = async (values: any) => {
        if (!variant) return;

        try {
            setLoading(true);
            await inventoryService.adjustStock(variant.product_variants_id, {
                quantityChange: values.quantityChange,
                reason: values.reason,
                notes: values.notes || '',
                actionType: values.actionType
            });

            message.success('Stock adjusted successfully!');
            form.resetFields();
            setQuantityChange(0);
            onSuccess();
            onClose();
        } catch (error: any) {
            message.error(error.message || 'Cannot adjust stock');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setQuantityChange(0);
        onClose();
    };

    const newQuantity = variant ? variant.stock_quantity + quantityChange : 0;

    return (
        <Modal
            title="Adjust Stock"
            open={open}
            onCancel={handleCancel}
            onOk={() => form.submit()}
            confirmLoading={loading}
            width={600}
        >
            {variant && (
                <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Product:</strong> {variant.product_name}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Variant:</strong> {variant.size_name} - {variant.color_name}
                    </div>
                    <div>
                        <strong>Current Stock:</strong> {variant.stock_quantity}
                    </div>
                </div>
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    actionType: 'adjustment',
                    quantityChange: 0
                }}
            >
                <Form.Item
                    label="Action Type"
                    name="actionType"
                    rules={[{ required: true, message: 'Please select action type' }]}
                >
                    <Select>
                        <Select.Option value="restock">Restock</Select.Option>
                        <Select.Option value="adjustment">Adjustment</Select.Option>
                        <Select.Option value="damaged">Damaged</Select.Option>
                        <Select.Option value="return">Return</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Quantity Change"
                    name="quantityChange"
                    rules={[
                        { required: true, message: 'Please enter quantity' },
                        {
                            validator: (_, value) => {
                                if (value === 0) {
                                    return Promise.reject('Quantity change must not be 0');
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                    extra={`Enter positive number to increase, negative to decrease`}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="E.g: +50 or -10"
                        onChange={(value) => setQuantityChange(value || 0)}
                    />
                </Form.Item>

                {variant && (
                    <div style={{
                        marginBottom: 16,
                        padding: 12,
                        background: newQuantity < 0 ? '#fff1f0' : '#e6f7ff',
                        border: `1px solid ${newQuantity < 0 ? '#ffccc7' : '#91d5ff'}`,
                        borderRadius: 4
                    }}>
                        <strong>Quantity after change:</strong> {newQuantity}
                        {newQuantity < 0 && (
                            <div style={{ color: '#cf1322', marginTop: 4 }}>
                                ⚠️ Warning: Stock cannot be negative!
                            </div>
                        )}
                    </div>
                )}

                <Form.Item
                    label="Reason"
                    name="reason"
                    rules={[{ required: true, message: 'Please enter adjustment reason' }]}
                >
                    <Input placeholder="E.g: Stock from supplier ABC" />
                </Form.Item>

                <Form.Item
                    label="Notes"
                    name="notes"
                >
                    <TextArea rows={3} placeholder="Additional notes (optional)" />
                </Form.Item>
            </Form>
        </Modal>
    );
}
