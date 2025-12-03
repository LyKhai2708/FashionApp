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
            message.error('Không thể tải thông tin phiếu nhập');
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
            message.success(status === 'completed' ? 'Đã nhập kho thành công' : 'Đã hủy phiếu nhập');
            fetchOrderDetail(order.po_id);
        } catch (error: any) {
            message.error(error.message || 'Không thể cập nhật trạng thái');
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
            pending: { color: 'orange', text: 'Chờ duyệt' },
            completed: { color: 'green', text: 'Đã nhập kho' },
            cancelled: { color: 'red', text: 'Đã hủy' }
        };
        const { color, text } = config[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
    };

    const columns = [
        {
            title: 'Sản phẩm',
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
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 120,
        },
        {
            title: 'Đơn giá',
            dataIndex: 'unit_price',
            key: 'unit_price',
            width: 150,
            render: (price: string) => formatCurrency(price)
        },
        {
            title: 'Thành tiền',
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
                        Quay lại
                    </Button>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                        Chi tiết phiếu nhập #{order.po_id}
                    </h1>
                    {getStatusTag(order.status)}
                </div>

                <Space>
                    <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
                        In phiếu
                    </Button>

                    {order.status === 'pending' && (
                        <>
                            <PermissionGate permission="purchase_orders.cancel">
                                <Popconfirm
                                    title="Hủy phiếu nhập?"
                                    description="Hành động này không thể hoàn tác."
                                    onConfirm={() => handleUpdateStatus('cancelled')}
                                    okText="Hủy phiếu"
                                    cancelText="Đóng"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button danger icon={<CloseOutlined />} loading={processing}>
                                        Hủy phiếu
                                    </Button>
                                </Popconfirm>
                            </PermissionGate>

                            <PermissionGate permission="purchase_orders.approve">
                                <Popconfirm
                                    title="Xác nhận nhập kho?"
                                    description="Kho hàng sẽ được cập nhật ngay lập tức."
                                    onConfirm={() => handleUpdateStatus('completed')}
                                    okText="Nhập kho"
                                    cancelText="Đóng"
                                >
                                    <Button type="primary" icon={<CheckOutlined />} loading={processing}>
                                        Nhập kho
                                    </Button>
                                </Popconfirm>
                            </PermissionGate>
                        </>
                    )}
                </Space>
            </div>

            <Row gutter={24}>
                <Col span={16}>
                    <Card title="Danh sách sản phẩm" style={{ marginBottom: 24 }}>
                        <Table
                            dataSource={order.items}
                            columns={columns}
                            rowKey="po_item_id"
                            pagination={false}
                        />
                        <div style={{ marginTop: 16, textAlign: 'right', fontSize: 16 }}>
                            Tổng tiền hàng: <span style={{ fontWeight: 'bold', color: '#1890ff', fontSize: 20 }}>
                                {formatCurrency(order.total_amount)}
                            </span>
                        </div>
                    </Card>
                </Col>

                <Col span={8}>
                    <Card title="Thông tin chung" style={{ marginBottom: 24 }}>
                        <Descriptions column={1} layout="vertical">
                            <Descriptions.Item label="Nhà cung cấp">
                                <span style={{ fontWeight: 500 }}>{order.supplier_name}</span>
                                <br />
                                <span style={{ color: '#666' }}>{order.supplier_phone}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Người tạo phiếu">
                                {order.staff_name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">
                                {new Date(order.created_at).toLocaleString('vi-VN')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày dự kiến nhập">
                                {order.expected_date ? new Date(order.expected_date).toLocaleDateString('vi-VN') : '---'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ghi chú">
                                {order.notes || 'Không có ghi chú'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
