import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Select, Input, DatePicker, Button, Table, InputNumber, Space, Divider, Row, Col } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { useMessage } from '../../App';
import supplierService from '../../services/supplierService';
import purchaseOrderService from '../../services/purchaseOrderService';
import type { Supplier } from '../../types/supplier';
import type { ProductVariant } from '../../types/product';
import type { CreatePurchaseOrderItemPayload } from '../../types/purchaseOrder';
import { getImageUrl } from '../../utils/imageHelper';
import AddProductModal from '../../components/admin/AddProductModal';

interface SelectedProduct extends CreatePurchaseOrderItemPayload {
    key: string;
    product_name: string;
    thumbnail: string;
    size_name: string;
    color_name: string;
    stock_quantity: number;
}

export default function CreatePurchaseOrder() {
    const navigate = useNavigate();
    const message = useMessage();
    const [form] = Form.useForm();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [addProductModalOpen, setAddProductModalOpen] = useState(false);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await supplierService.getSuppliers(1, 100);
            setSuppliers(response.data.suppliers);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const handleAddProduct = (
        variant: ProductVariant,
        quantity: number,
        unitPrice: number,
        productInfo: { product_id: number; product_name: string; thumbnail: string }
    ) => {
        const newKey = `${productInfo.product_id}-${variant.variant_id}`;

        if (selectedProducts.some(p => p.key === newKey)) {
            message.warning('This product has already been added to the list');
            return;
        }

        const newItem: SelectedProduct = {
            key: newKey,
            product_variant_id: variant.variant_id,
            quantity: quantity,
            unit_price: unitPrice,
            product_name: productInfo.product_name,
            thumbnail: productInfo.thumbnail,
            size_name: variant.size.name,
            color_name: variant.color.name,
            stock_quantity: variant.stock_quantity
        };

        setSelectedProducts([...selectedProducts, newItem]);
    };

    const handleRemoveItem = (key: string) => {
        setSelectedProducts(selectedProducts.filter(item => item.key !== key));
    };

    const handleQuantityChange = (key: string, value: number | null) => {
        setSelectedProducts(selectedProducts.map(item =>
            item.key === key ? { ...item, quantity: value || 1 } : item
        ));
    };

    const handlePriceChange = (key: string, value: number | null) => {
        setSelectedProducts(selectedProducts.map(item =>
            item.key === key ? { ...item, unit_price: value || 0 } : item
        ));
    };

    const calculateTotal = () => {
        return selectedProducts.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };

    const handleSubmit = async (values: any) => {
        if (selectedProducts.length === 0) {
            message.error('Please select at least 1 product');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                supplier_id: values.supplier_id,
                notes: values.notes,
                expected_date: values.expected_date ? values.expected_date.toISOString() : undefined,
                items: selectedProducts.map(item => ({
                    product_variant_id: item.product_variant_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))
            };

            await purchaseOrderService.createPurchaseOrder(payload);
            message.success('Purchase order created successfully');
            navigate('/admin/purchase-orders');
        } catch (error: any) {
            message.error(error.message || 'Error creating purchase order');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Product',
            dataIndex: 'product_name',
            key: 'product_name',
            render: (text: string, record: SelectedProduct) => (
                <Space>
                    <img src={getImageUrl(record.thumbnail)} alt={text} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                            {record.color_name} - {record.size_name}
                        </div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Import Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 150,
            render: (value: number, record: SelectedProduct) => (
                <InputNumber
                    min={1}
                    value={value}
                    onChange={(val) => handleQuantityChange(record.key, val)}
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Unit Price',
            dataIndex: 'unit_price',
            key: 'unit_price',
            width: 200,
            render: (value: number, record: SelectedProduct) => (
                <InputNumber
                    min={0}
                    value={value}
                    onChange={(val) => handlePriceChange(record.key, val)}
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                    addonAfter="₫"
                />
            )
        },
        {
            title: 'Line Total',
            key: 'total',
            width: 200,
            render: (_: any, record: SelectedProduct) => (
                <span style={{ fontWeight: 600 }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.quantity * record.unit_price)}
                </span>
            )
        },
        {
            title: '',
            key: 'action',
            width: 50,
            render: (_: any, record: SelectedProduct) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(record.key)}
                />
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/purchase-orders')}>
                    Back
                </Button>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                    Create Purchase Order
                </h1>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Row gutter={24}>
                    <Col span={16}>
                        <Card title="Product List" style={{ marginBottom: 24 }}>
                            <div style={{ marginBottom: 16 }}>
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={() => setAddProductModalOpen(true)}
                                    size="large"
                                    block
                                >
                                    Add product to purchase order
                                </Button>
                            </div>

                            <Table
                                dataSource={selectedProducts}
                                columns={columns}
                                rowKey="key"
                                pagination={false}
                                locale={{ emptyText: 'No products selected yet' }}
                            />
                        </Card>
                    </Col>

                    <Col span={8}>
                        <Card title="Purchase Order Information">
                            <Form.Item
                                name="supplier_id"
                                label="Supplier"
                                rules={[{ required: true, message: 'Please select a supplier' }]}
                            >
                                <Select
                                    placeholder="Select supplier"
                                    options={suppliers.map(s => ({ value: s.supplier_id, label: s.name }))}
                                />
                            </Form.Item>

                            <Form.Item
                                name="expected_date"
                                label="Expected Delivery Date"
                            >
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>

                            <Form.Item
                                name="notes"
                                label="Notes"
                            >
                                <Input.TextArea rows={4} placeholder="Notes for purchase order..." />
                            </Form.Item>

                            <Divider />

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 16 }}>
                                <span>Total Amount:</span>
                                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}
                                </span>
                            </div>

                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                block
                                size="large"
                                loading={submitting}
                            >
                                Complete Purchase Order
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </Form>

            <AddProductModal
                open={addProductModalOpen}
                onClose={() => setAddProductModalOpen(false)}
                onAddProduct={handleAddProduct}
            />
        </div>
    );
}
