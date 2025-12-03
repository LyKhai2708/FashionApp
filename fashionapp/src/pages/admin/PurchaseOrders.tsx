import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Space, Tag, Select, DatePicker } from 'antd';
import { PlusOutlined, EyeOutlined, ShoppingCartOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMessage } from '../../App';
import purchaseOrderService from '../../services/purchaseOrderService';
import type { PurchaseOrder } from '../../types/purchaseOrder';
import { PermissionGate } from '../../components/PermissionGate';

export default function PurchaseOrders() {
    const navigate = useNavigate();
    const message = useMessage();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const fetchOrders = async (page = 1, limit = 10, status = '') => {
        try {
            setLoading(true);
            const response = await purchaseOrderService.getPurchaseOrders(page, limit, status);
            setOrders(response.data.orders);
            setPagination({
                current: response.data.metadata.page,
                pageSize: response.data.metadata.limit,
                total: response.data.metadata.total
            });
        } catch (error: any) {
            message.error('Không thể tải danh sách phiếu nhập');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(pagination.current, pagination.pageSize, statusFilter);
    }, []);

    const handleTableChange = (newPagination: any) => {
        fetchOrders(newPagination.current, newPagination.pageSize, statusFilter);
    };

    const handleFilterChange = (value: string) => {
        setStatusFilter(value);
        fetchOrders(1, pagination.pageSize, value);
    };

    const handleResetFilters = () => {
        setStatusFilter('');
        fetchOrders(1, pagination.pageSize, '');
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
            title: 'Mã phiếu',
            dataIndex: 'po_id',
            key: 'po_id',
            width: 100,
            render: (id: number) => <span style={{ fontWeight: 500 }}>#{id}</span>
        },
        {
            title: 'Nhà cung cấp',
            dataIndex: 'supplier_name',
            key: 'supplier_name',
            render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
        },
        {
            title: 'Người tạo',
            dataIndex: 'staff_name',
            key: 'staff_name',
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (amount: string) => (
                <span style={{ fontWeight: 600, color: '#1890ff' }}>
                    {formatCurrency(amount)}
                </span>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => getStatusTag(status)
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            render: (_: any, record: PurchaseOrder) => (
                <Space>
                    <PermissionGate permission="purchase_orders.view">
                        <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/admin/purchase-orders/${record.po_id}`)}
                        >
                            Chi tiết
                        </Button>
                    </PermissionGate>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                    <ShoppingCartOutlined /> Quản lý nhập hàng
                </h1>
                <PermissionGate permission="purchase_orders.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/admin/purchase-orders/create')}
                        size="large"
                    >
                        Tạo phiếu nhập
                    </Button>
                </PermissionGate>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Space>
                    <div>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Trạng thái</div>
                        <Select
                            value={statusFilter || undefined}
                            onChange={handleFilterChange}
                            style={{ width: 200 }}
                            placeholder="Tất cả"
                            allowClear
                        >
                            <Select.Option value="pending">Chờ duyệt</Select.Option>
                            <Select.Option value="completed">Đã nhập kho</Select.Option>
                            <Select.Option value="cancelled">Đã hủy</Select.Option>
                        </Select>
                    </div>
                    <div style={{ paddingTop: 30 }}>
                        <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                            Đặt lại
                        </Button>
                    </div>
                </Space>
            </Card>

            <Card>
                <Table
                    dataSource={orders}
                    columns={columns}
                    rowKey="po_id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} phiếu nhập`
                    }}
                    onChange={handleTableChange}
                    locale={{
                        emptyText: 'Chưa có phiếu nhập nào'
                    }}
                />
            </Card>
        </div>
    );
}
