import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Select, Button, Space, Tag } from 'antd';
import { ShoppingOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import orderService, { type Order } from '../../services/orderService';
import type { ColumnsType } from 'antd/es/table';

const Orders: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        loadOrders();
    }, [currentPage, orderStatus, paymentStatus, paymentMethod]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError('');

            const params: any = {
                page: currentPage,
                limit: limit
            };

            if (orderStatus) params.order_status = orderStatus;
            if (paymentStatus) params.payment_status = paymentStatus;
            if (paymentMethod) params.payment_method = paymentMethod;

            const result = await orderService.getAllOrders(params);
            setOrders(result.orders);
            setTotalPages(result.pagination.total_pages);
            setTotal(result.pagination.total);
        } catch (err: any) {
            setError(err.message || 'Cannot load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleResetFilters = () => {
        setOrderStatus('');
        setPaymentStatus('');
        setPaymentMethod('');
        setCurrentPage(1);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getOrderStatusTag = (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
            pending: { color: 'orange', text: 'Pending' },
            processing: { color: 'blue', text: 'Processing' },
            shipped: { color: 'cyan', text: 'Shipped' },
            delivered: { color: 'green', text: 'Delivered' },
            cancelled: { color: 'red', text: 'Cancelled' }
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const getPaymentStatusTag = (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
            pending: { color: 'orange', text: 'Unpaid' },
            paid: { color: 'green', text: 'Paid' },
            failed: { color: 'red', text: 'Failed' },
            cancelled: { color: 'default', text: 'Cancelled' },
            refunded: { color: 'purple', text: 'Refunded' }
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const columns: ColumnsType<Order> = [
        {
            title: 'Order Code',
            key: 'order_code',
            width: 120,
            render: (_, record) => (
                <span style={{ fontWeight: 500 }}>#{record.order_code || record.order_id}</span>
            )
        },
        {
            title: 'Customer',
            key: 'customer',
            width: 180,
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{record.receiver_name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{record.receiver_phone}</div>
                </div>
            )
        },
        {
            title: 'Total Amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            width: 130,
            render: (amount: number) => (
                <span style={{ fontWeight: 600, color: '#1890ff' }}>{formatCurrency(amount)}</span>
            )
        },
        {
            title: 'Order Status',
            dataIndex: 'order_status',
            key: 'order_status',
            width: 130,
            render: (status: string) => getOrderStatusTag(status)
        },
        {
            title: 'Payment',
            dataIndex: 'payment_status',
            key: 'payment_status',
            width: 140,
            render: (status: string) => getPaymentStatusTag(status)
        },
        {
            title: 'Order Date',
            dataIndex: 'order_date',
            key: 'order_date',
            width: 150,
            render: (date: string) => formatDate(date)
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/admin/orders/${record.order_id}`)}
                >
                    Details
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    <ShoppingOutlined /> Order Management
                </h1>
                <div className="text-sm text-gray-500">
                    Total: <span className="font-semibold text-black">{total}</span> orders
                </div>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Space size="middle" wrap>
                    <div>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Order Status</div>
                        <Select
                            value={orderStatus || undefined}
                            onChange={(value) => {
                                setOrderStatus(value || '');
                                setCurrentPage(1);
                            }}
                            style={{ width: 200 }}
                            placeholder="All"
                            allowClear
                        >
                            <Select.Option value="pending">Pending</Select.Option>
                            <Select.Option value="processing">Processing</Select.Option>
                            <Select.Option value="shipped">Shipped</Select.Option>
                            <Select.Option value="delivered">Delivered</Select.Option>
                            <Select.Option value="cancelled">Cancelled</Select.Option>
                        </Select>
                    </div>

                    <div>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Payment Status</div>
                        <Select
                            value={paymentStatus || undefined}
                            onChange={(value) => {
                                setPaymentStatus(value || '');
                                setCurrentPage(1);
                            }}
                            style={{ width: 200 }}
                            placeholder="All"
                            allowClear
                        >
                            <Select.Option value="pending">Unpaid</Select.Option>
                            <Select.Option value="paid">Paid</Select.Option>
                            <Select.Option value="failed">Payment Failed</Select.Option>
                            <Select.Option value="cancelled">Cancelled</Select.Option>
                            <Select.Option value="refunded">Refunded</Select.Option>
                        </Select>
                    </div>

                    <div>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Payment Method</div>
                        <Select
                            value={paymentMethod || undefined}
                            onChange={(value) => {
                                setPaymentMethod(value || '');
                                setCurrentPage(1);
                            }}
                            style={{ width: 200 }}
                            placeholder="All"
                            allowClear
                        >
                            <Select.Option value="cod">COD</Select.Option>
                            <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
                            <Select.Option value="payos">PayOS</Select.Option>
                        </Select>
                    </div>

                    <div style={{ paddingTop: 30 }}>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleResetFilters}
                        >
                            Reset Filters
                        </Button>
                    </div>
                </Space>
            </Card>

            <Card>
                <Table
                    dataSource={orders}
                    columns={columns}
                    rowKey="order_id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: limit,
                        total: total,
                        onChange: (page) => setCurrentPage(page),
                        showSizeChanger: false,
                        showTotal: (total) => `Total ${total} orders`
                    }}
                    locale={{
                        emptyText: error ? (
                            <div style={{ padding: '40px 0' }}>
                                <p style={{ color: '#ff4d4f', marginBottom: 16 }}>{error}</p>
                                <Button type="primary" onClick={loadOrders}>Retry</Button>
                            </div>
                        ) : 'No orders found'
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>
        </div>
    );
};

export default Orders;
