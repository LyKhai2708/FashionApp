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
            message.warning('Sản phẩm này đã được thêm vào danh sách');
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
            message.error('Vui lòng chọn ít nhất 1 sản phẩm');
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
            message.success('Tạo phiếu nhập thành công');
            navigate('/admin/purchase-orders');
        } catch (error: any) {
            message.error(error.message || 'Lỗi khi tạo phiếu nhập');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'Sản phẩm',
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
            title: 'Số lượng nhập',
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
            title: 'Đơn giá nhập',
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
            title: 'Thành tiền',
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
                    Quay lại
                </Button>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                    Tạo phiếu nhập kho
                </h1>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Row gutter={24}>
                    <Col span={16}>
                        <Card title="Danh sách sản phẩm" style={{ marginBottom: 24 }}>
                            <div style={{ marginBottom: 16 }}>
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={() => setAddProductModalOpen(true)}
                                    size="large"
                                    block
                                >
                                    Thêm sản phẩm vào phiếu nhập
                                </Button>
                            </div>

                            <Table
                                dataSource={selectedProducts}
                                columns={columns}
                                rowKey="key"
                                pagination={false}
                                locale={{ emptyText: 'Chưa có sản phẩm nào được chọn' }}
                            />
                        </Card>
                    </Col>

                    <Col span={8}>
                        <Card title="Thông tin phiếu nhập">
                            <Form.Item
                                name="supplier_id"
                                label="Nhà cung cấp"
                                rules={[{ required: true, message: 'Vui lòng chọn nhà cung cấp' }]}
                            >
                                <Select
                                    placeholder="Chọn nhà cung cấp"
                                    options={suppliers.map(s => ({ value: s.supplier_id, label: s.name }))}
                                />
                            </Form.Item>

                            <Form.Item
                                name="expected_date"
                                label="Ngày dự kiến nhập"
                            >
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>

                            <Form.Item
                                name="notes"
                                label="Ghi chú"
                            >
                                <Input.TextArea rows={4} placeholder="Ghi chú cho phiếu nhập..." />
                            </Form.Item>

                            <Divider />

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 16 }}>
                                <span>Tổng tiền hàng:</span>
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
                                Hoàn tất phiếu nhập
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
