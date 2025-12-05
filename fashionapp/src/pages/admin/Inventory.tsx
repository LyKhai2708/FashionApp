import { useState, useEffect } from 'react';
import { Card, Table, Tabs, Input, Select, Button, Tag, Tooltip, Space, Statistic, Row, Col, DatePicker } from 'antd';
import { SearchOutlined, WarningOutlined, EditOutlined, HistoryOutlined, StockOutlined } from '@ant-design/icons';
import inventoryService, { type LowStockProduct, type StockHistoryItem } from '../../services/inventoryService';
import StockAdjustmentModal from '../../components/admin/StockAdjustmentModal';
import { getImageUrl } from '../../utils/imageHelper';
import dayjs from 'dayjs';
import { PermissionGate } from '../../components/PermissionGate';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

export default function Inventory() {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);

    const [overview, setOverview] = useState<any>(null);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [lowStockMetadata, setLowStockMetadata] = useState<any>(null);
    const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>([]);
    const [historyMetadata, setHistoryMetadata] = useState<any>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [stockStatus, setStockStatus] = useState<'all' | 'low' | 'out'>('all');
    const [threshold, setThreshold] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyActionType, setHistoryActionType] = useState<string>('');
    const [historyDateRange, setHistoryDateRange] = useState<[string, string] | null>(null);

    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'overview') {
            loadOverview();
        } else if (activeTab === 'low-stock') {
            loadLowStockProducts();
        } else if (activeTab === 'history') {
            loadStockHistory();
        }
    }, [activeTab, currentPage, searchTerm, stockStatus, threshold, historyPage, historyActionType, historyDateRange]);

    const loadOverview = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getOverview();
            setOverview(data);
        } catch (error: any) {
            console.error('Load overview error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLowStockProducts = async () => {
        try {
            setLoading(true);
            const { products, metadata } = await inventoryService.getLowStockProducts({
                page: currentPage,
                limit: 20,
                threshold,
                search: searchTerm || undefined,
                stockStatus
            });
            setLowStockProducts(products);
            setLowStockMetadata(metadata);
        } catch (error: any) {
            console.error('Load low stock products error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStockHistory = async () => {
        try {
            setLoading(true);
            const { history, metadata } = await inventoryService.getStockHistory({
                page: historyPage,
                limit: 50,
                actionType: historyActionType || undefined,
                startDate: historyDateRange?.[0],
                endDate: historyDateRange?.[1]
            });
            setStockHistory(history);
            setHistoryMetadata(metadata);
        } catch (error: any) {
            console.error('Load stock history error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustStock = (product: LowStockProduct) => {
        setSelectedVariant({
            product_variants_id: product.product_variants_id,
            product_name: product.product_name,
            size_name: product.size_name,
            color_name: product.color_name,
            stock_quantity: product.stock_quantity
        });
        setAdjustModalOpen(true);
    };

    const handleAdjustSuccess = () => {
        loadLowStockProducts();
        if (activeTab === 'overview') {
            loadOverview();
        }
    };

    const lowStockColumns = [
        {
            title: 'Product',
            key: 'product',
            width: 300,
            render: (_: any, record: LowStockProduct) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                        src={getImageUrl(record.thumbnail)}
                        alt={record.product_name}
                        style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.product_name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                            {record.size_name} - {record.color_name}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category_name',
            key: 'category_name',
            width: 150
        },
        {
            title: 'Brand',
            dataIndex: 'brand_name',
            key: 'brand_name',
            width: 150
        },
        {
            title: 'Stock',
            dataIndex: 'stock_quantity',
            key: 'stock_quantity',
            width: 120,
            render: (stock: number) => (
                <Tag color={stock === 0 ? 'red' : stock < 5 ? 'orange' : 'gold'}>
                    {stock} {stock === 0 ? '(Out of stock)' : stock < 5 ? '(Very low)' : '(Low)'}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_: any, record: LowStockProduct) => (
                <PermissionGate
                    permission="inventory.adjust"
                    showTooltip={true}
                    tooltipMessage="You do not have permission to adjust inventory"
                    fallback={
                        <Button
                            type="primary"
                            size="small"
                            icon={<EditOutlined />}
                            disabled
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        >
                            Adjust
                        </Button>
                    }
                >
                    <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleAdjustStock(record)}
                    >
                        Adjust
                    </Button>
                </PermissionGate>
            )
        }
    ];

    const historyColumns = [
        {
            title: 'Time',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Product',
            key: 'product',
            width: 250,
            render: (_: any, record: StockHistoryItem) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{record.product_name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                        {record.size_name} - {record.color_name}
                    </div>
                </div>
            )
        },
        {
            title: 'Type',
            dataIndex: 'action_type',
            key: 'action_type',
            width: 130,
            render: (type: string) => {
                const colors: Record<string, string> = {
                    sale: 'blue',
                    restock: 'green',
                    adjustment: 'orange',
                    damaged: 'red',
                    return: 'purple',
                    order_cancelled: 'cyan'
                };
                const labels: Record<string, string> = {
                    sale: 'Sale',
                    restock: 'Restock',
                    adjustment: 'Adjustment',
                    damaged: 'Damaged',
                    return: 'Return',
                    order_cancelled: 'Order Cancelled'
                };
                return <Tag color={colors[type]}>{labels[type]}</Tag>;
            }
        },
        {
            title: 'Change',
            key: 'change',
            width: 180,
            render: (_: any, record: StockHistoryItem) => (
                <div>
                    <span style={{ color: '#666' }}>{record.quantity_before}</span>
                    <span style={{
                        margin: '0 8px',
                        color: record.quantity_change > 0 ? 'green' : 'red',
                        fontWeight: 'bold'
                    }}>
                        {record.quantity_change > 0 ? '+' : ''}{record.quantity_change}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>{record.quantity_after}</span>
                </div>
            )
        },
        {
            title: 'Source',
            key: 'source',
            width: 180,
            render: (_: any, record: StockHistoryItem) => {
                if (record.action_type === 'sale' && record.customer_name) {
                    return <div style={{ fontSize: 12 }}>
                        <div style={{ color: '#666' }}>Customer:</div>
                        <div style={{ fontWeight: 500 }}>{record.customer_name}</div>
                    </div>;
                }
                if (record.action_type === 'restock' && record.supplier_name) {
                    return <div style={{ fontSize: 12 }}>
                        <div style={{ color: '#666' }}>Supplier:</div>
                        <div style={{ fontWeight: 500 }}>{record.supplier_name}</div>
                    </div>;
                }
                return <span style={{ color: '#999' }}>---</span>;
            }
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            ellipsis: true
        },
        {
            title: 'Performed By',
            dataIndex: 'admin_username',
            key: 'admin_username',
            width: 130,
            render: (username: string) => username || <Tag color="blue">System</Tag>
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    <StockOutlined /> Inventory Management
                </h1>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="Overview" key="overview">
                    {overview && (
                        <>
                            <Row gutter={16} style={{ marginBottom: 24 }}>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title="Total Variants"
                                            value={overview.total.variants}
                                            valueStyle={{ color: '#3f8600' }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title="Total Stock"
                                            value={overview.total.stock}
                                            valueStyle={{ color: '#1890ff' }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title="Low Stock"
                                            value={overview.total.lowStock}
                                            valueStyle={{ color: '#faad14' }}
                                            prefix={<WarningOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title="Out of Stock"
                                            value={overview.total.outOfStock}
                                            valueStyle={{ color: '#cf1322' }}
                                            prefix={<WarningOutlined />}
                                        />
                                    </Card>
                                </Col>
                            </Row>

                            <Card title="Stock by Category">
                                <Table
                                    dataSource={overview.byCategory}
                                    rowKey="categoryId"
                                    pagination={false}
                                    columns={[
                                        {
                                            title: 'Category',
                                            dataIndex: 'categoryName',
                                            key: 'categoryName'
                                        },
                                        {
                                            title: 'Product Count',
                                            dataIndex: 'productCount',
                                            key: 'productCount'
                                        },
                                        {
                                            title: 'Total Stock',
                                            dataIndex: 'totalStock',
                                            key: 'totalStock'
                                        },
                                        {
                                            title: 'Low Stock',
                                            dataIndex: 'lowStockCount',
                                            key: 'lowStockCount',
                                            render: (count: number) => (
                                                <Tag color={count > 0 ? 'orange' : 'default'}>{count}</Tag>
                                            )
                                        },
                                        {
                                            title: 'Out of Stock',
                                            dataIndex: 'outOfStockCount',
                                            key: 'outOfStockCount',
                                            render: (count: number) => (
                                                <Tag color={count > 0 ? 'red' : 'default'}>{count}</Tag>
                                            )
                                        }
                                    ]}
                                />
                            </Card>
                        </>
                    )}
                </TabPane>

                <TabPane tab="Low Stock Products" key="low-stock">
                    <Card>
                        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                                <Input
                                    placeholder="Search products..."
                                    prefix={<SearchOutlined />}
                                    style={{ width: 250 }}
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                                <Select
                                    value={stockStatus}
                                    style={{ width: 150 }}
                                    onChange={(value) => {
                                        setStockStatus(value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <Select.Option value="all">All</Select.Option>
                                    <Select.Option value="low">Low Stock</Select.Option>
                                    <Select.Option value="out">Out of Stock</Select.Option>
                                </Select>
                                <Tooltip title="Low stock warning threshold">
                                    <Select
                                        value={threshold}
                                        style={{ width: 150 }}
                                        onChange={(value) => {
                                            setThreshold(value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <Select.Option value={5}>Below 5</Select.Option>
                                        <Select.Option value={10}>Below 10</Select.Option>
                                        <Select.Option value={20}>Below 20</Select.Option>
                                        <Select.Option value={50}>Below 50</Select.Option>
                                        <Select.Option value={100}>Below 100</Select.Option>
                                        <Select.Option value={9999}>All</Select.Option>
                                    </Select>
                                </Tooltip>
                            </Space>
                        </Space>

                        <Table
                            dataSource={lowStockProducts}
                            columns={lowStockColumns}
                            rowKey="product_variants_id"
                            loading={loading}
                            pagination={{
                                current: currentPage,
                                pageSize: 20,
                                total: lowStockMetadata?.totalRecords || 0,
                                onChange: (page) => setCurrentPage(page),
                                showSizeChanger: false,
                                showTotal: (total) => `Total ${total} products`
                            }}
                        />
                    </Card>
                </TabPane>

                <TabPane tab={<span><HistoryOutlined /> History</span>} key="history">
                    <Card>
                        <Space style={{ marginBottom: 16 }}>
                            <Select
                                placeholder="Action type"
                                style={{ width: 150 }}
                                value={historyActionType || undefined}
                                onChange={(value) => {
                                    setHistoryActionType(value || '');
                                    setHistoryPage(1);
                                }}
                                allowClear
                            >
                                <Select.Option value="sale">Sale</Select.Option>
                                <Select.Option value="restock">Restock</Select.Option>
                                <Select.Option value="adjustment">Adjustment</Select.Option>
                                <Select.Option value="damaged">Damaged</Select.Option>
                                <Select.Option value="return">Return</Select.Option>
                                <Select.Option value="order_cancelled">Order Cancelled</Select.Option>
                            </Select>
                            <RangePicker
                                format="DD/MM/YYYY"
                                onChange={(dates) => {
                                    if (dates && dates[0] && dates[1]) {
                                        setHistoryDateRange([
                                            dates[0].format('YYYY-MM-DD'),
                                            dates[1].format('YYYY-MM-DD')
                                        ]);
                                    } else {
                                        setHistoryDateRange(null);
                                    }
                                    setHistoryPage(1);
                                }}
                            />
                        </Space>

                        <Table
                            dataSource={stockHistory}
                            columns={historyColumns}
                            rowKey="history_id"
                            loading={loading}
                            pagination={{
                                current: historyPage,
                                pageSize: 50,
                                total: historyMetadata?.totalRecords || 0,
                                onChange: (page) => setHistoryPage(page),
                                showSizeChanger: false,
                                showTotal: (total) => `Total ${total} records`
                            }}
                        />
                    </Card>
                </TabPane>
            </Tabs>

            <StockAdjustmentModal
                open={adjustModalOpen}
                onClose={() => setAdjustModalOpen(false)}
                onSuccess={handleAdjustSuccess}
                variant={selectedVariant}
            />
        </div>
    );
}
