import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Space, Tag, Descriptions, Divider, Popconfirm, Row, Col } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, PrinterOutlined } from '@ant-design/icons';
import { useMessage } from '../../App';
import purchaseOrderService from '../../services/purchaseOrderService';
import type { PurchaseOrder, PurchaseOrderItem } from '../../types/purchaseOrder';
import { PermissionGate } from '../../components/PermissionGate';
import { getImageUrl } from '../../utils/imageHelper';

export default function PurchaseOrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const message = useMessage();
    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (id) {
            fetchOrderDetail(parseInt(id));
        }
    }, [id]);

    const fetchOrderDetail = async (orderId: number) => {
        try {
            setLoading(true);
            const response = await purchaseOrderService.getPurchaseOrderById(orderId);
            setOrder(response.data.order);
        } catch (error: any) {
            message.error('Cannot load purchase order details');
            navigate('/admin/purchase-orders');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status: 'completed' | 'cancelled') => {
        if (!order) return;

        try {
            setProcessing(true);
            await purchaseOrderService.updateStatus(order.po_id, status);
            message.success(status === 'completed' ? 'Inventory received successfully' : 'Purchase order cancelled');
            fetchOrderDetail(order.po_id);
        } catch (error: any) {
            message.error(error.message || 'Cannot update status');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(Number(amount));
    };

    const getStatusTag = (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
            pending: { color: 'orange', text: 'Pending' },
            completed: { color: 'green', text: 'Received' },
            cancelled: { color: 'red', text: 'Cancelled' }
        };
        const { color, text } = config[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
    };

    const columns = [
        {
            title: 'Product',
            dataIndex: 'product_name',
            key: 'product_name',
            render: (text: string, record: PurchaseOrderItem) => (
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
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 120,
        },
        {
            title: 'Unit Price',
            dataIndex: 'unit_price',
            key: 'unit_price',
            width: 150,
            render: (price: string) => formatCurrency(price)
        },
        {
            title: 'Line Total',
            key: 'total',
            width: 150,
            render: (_: any, record: PurchaseOrderItem) => (
                <span style={{ fontWeight: 600 }}>
                    {formatCurrency(Number(record.quantity) * Number(record.unit_price))}
                </span>
            )
        }
    ];

    if (loading) return <Card loading />;
    if (!order) return null;

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/purchase-orders')}>
                        Back
                    </Button>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                        Purchase Order #{order.po_id}
                    </h1>
                    {getStatusTag(order.status)}
                </div>

                <Space>
                    <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
                        Print
                    </Button>

                    {order.status === 'pending' && (
                        <>
                            <PermissionGate permission="purchase_orders.cancel">
                                <Popconfirm
                                    title="Cancel purchase order?"
                                    description="This action cannot be undone."
                                    onConfirm={() => handleUpdateStatus('cancelled')}
                                    okText="Cancel Order"
                                    cancelText="Close"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button danger icon={<CloseOutlined />} loading={processing}>
                                        Cancel Order
                                    </Button>
                                </Popconfirm>
                            </PermissionGate>

                            <PermissionGate permission="purchase_orders.approve">
                                <Popconfirm
                                    title="Confirm inventory receipt?"
                                    description="Inventory will be updated immediately."
                                    onConfirm={() => handleUpdateStatus('completed')}
                                    okText="Receive"
                                    cancelText="Close"
                                >
                                    <Button type="primary" icon={<CheckOutlined />} loading={processing}>
                                        Receive
                                    </Button>
                                </Popconfirm>
                            </PermissionGate>
                        </>
                    )}
                </Space>
            </div>

            <Row gutter={24}>
                <Col span={16}>
                    <Card title="Product List" style={{ marginBottom: 24 }}>
                        <Table
                            dataSource={order.items}
                            columns={columns}
                            rowKey="po_item_id"
                            pagination={false}
                        />
                        <div style={{ marginTop: 16, textAlign: 'right', fontSize: 16 }}>
                            Total Amount: <span style={{ fontWeight: 'bold', color: '#1890ff', fontSize: 20 }}>
                                {formatCurrency(order.total_amount)}
                            </span>
                        </div>
                    </Card>
                </Col>

                <Col span={8}>
                    <Card title="General Information" style={{ marginBottom: 24 }}>
                        <Descriptions column={1} layout="vertical">
                            <Descriptions.Item label="Supplier">
                                <span style={{ fontWeight: 500 }}>{order.supplier_name}</span>
                                <br />
                                <span style={{ color: '#666' }}>{order.supplier_phone}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Created By">
                                {order.staff_name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Created Date">
                                {new Date(order.created_at).toLocaleString('vi-VN')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Expected Delivery Date">
                                {order.expected_date ? new Date(order.expected_date).toLocaleDateString('vi-VN') : '---'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Notes">
                                {order.notes || 'No notes'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
