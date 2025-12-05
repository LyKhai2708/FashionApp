import { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Space,
    Tag,
    Modal,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Switch,
    message,
    Popconfirm,
    Card,
    Statistic,
    Row,
    Col,
    Badge
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    EyeOutlined,
    GiftOutlined,
    PercentageOutlined,
    ShoppingOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import promotionService, { type Promotion } from '../../services/promotionService';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { PermissionGate } from '../../components/PermissionGate';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface Paginate {
    totalRecords: number;
    firstPage: number;
    lastPage: number;
    page: number;
    limit: number;
}

export default function Promotions() {
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [paginate, setPaginate] = useState<Paginate>({
        totalRecords: 0,
        firstPage: 1,
        lastPage: 1,
        page: 1,
        limit: 10,
    });

    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [viewingPromotion, setViewingPromotion] = useState<Promotion | null>(null);
    const [form] = Form.useForm();

    const fetchPromotions = async (params?: any) => {
        setLoading(true);
        try {
            const result = await promotionService.getPromotions({
                page: params?.page || paginate.page,
                limit: params?.limit || paginate.limit,
                ...params
            });
            setPromotions(result.promotions);
            setPaginate(result.metadata);
        } catch (error: any) {
            message.error(error.message || 'Cannot load promotions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const handleCreate = () => {
        setEditingPromotion(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleView = (promotion: Promotion) => {
        setViewingPromotion(promotion);
        setDetailModalVisible(true);
    };

    const handleViewProducts = (promotion: Promotion) => {
        navigate(`/admin/promotions/${promotion.promo_id}/products`);
    };

    const handleDelete = async (promoId: number) => {
        try {
            await promotionService.deletePromotion(promoId);
            message.success('Promotion deleted successfully');
            fetchPromotions();
        } catch (error: any) {
            message.error(error.message || 'Cannot delete promotion');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            const payload = {
                name: values.name,
                description: values.description || null,
                discount_percent: Number(values.discount_percent),
                start_date: values.dateRange[0].format('YYYY-MM-DD'),
                end_date: values.dateRange[1].format('YYYY-MM-DD'),
                active: values.active !== undefined ? values.active : true
            };

            if (editingPromotion) {
                message.info('Update function is not yet supported by backend');
            } else {
                await promotionService.createPromotion(payload);
                message.success('Promotion created successfully');
            }

            setModalVisible(false);
            form.resetFields();
            fetchPromotions();
        } catch (error: any) {
            message.error(error.message || 'Cannot save promotion');
        }
    };

    const getStatusColor = (promotion: Promotion) => {
        if (!promotion.active) return 'red';
        const now = dayjs();
        const startDate = dayjs(promotion.start_date);
        const endDate = dayjs(promotion.end_date);

        if (now.isBefore(startDate)) return 'blue';
        if (now.isAfter(endDate)) return 'red';
        if (now.diff(endDate, 'day') >= -3) return 'orange';
        return 'green';
    };

    const getStatusText = (promotion: Promotion) => {
        if (!promotion.active) return 'Disabled';
        const now = dayjs();
        const startDate = dayjs(promotion.start_date);
        const endDate = dayjs(promotion.end_date);

        if (now.isBefore(startDate)) return 'Upcoming';
        if (now.isAfter(endDate)) return 'Ended';
        return 'Active';
    };

    const columns: ColumnsType<Promotion> = [
        {
            title: 'Promotion Name',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (name) => <span className="font-medium">{name}</span>
        },
        {
            title: 'Discount',
            dataIndex: 'discount_percent',
            key: 'discount_percent',
            width: 120,
            render: (value) => (
                <Tag color="red" className="text-base font-semibold">
                    -{value}%
                </Tag>
            ),
        },
        {
            title: 'Products',
            dataIndex: 'product_count',
            key: 'product_count',
            width: 100,
            render: (count) => (
                <Badge count={count} showZero color="#1890ff" />
            ),
        },
        {
            title: 'Duration',
            key: 'duration',
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    <span className="text-xs">
                        {dayjs(record.start_date).format('DD/MM/YYYY')} - {dayjs(record.end_date).format('DD/MM/YYYY')}
                    </span>
                    <Tag color={getStatusColor(record)}>
                        {getStatusText(record)}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 180,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                        title="View details"
                    />
                    <Button
                        type="text"
                        icon={<ShoppingOutlined />}
                        onClick={() => handleViewProducts(record)}
                        title="View products"
                    />
                    <PermissionGate permission="promotions.delete">
                        <Popconfirm
                            title="Delete this promotion?"
                            description="Are you sure you want to delete this promotion?"
                            onConfirm={() => handleDelete(record.promo_id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okType="danger"
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                title="Delete"
                            />
                        </Popconfirm>
                    </PermissionGate>
                </Space>
            ),
        },
    ];

    const totalPromotions = promotions.length;
    const activePromotions = promotions.filter(p => {
        const now = dayjs();
        const start = dayjs(p.start_date);
        const end = dayjs(p.end_date);
        return p.active && now.isAfter(start) && now.isBefore(end);
    }).length;
    const totalProducts = promotions.reduce((sum, p) => sum + (p.product_count || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Promotion Management</h1>
                    <p className="text-gray-600 mt-1">Total: {paginate.totalRecords} promotions</p>
                </div>
                <PermissionGate permission="promotions.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                    >
                        Create New Promotion
                    </Button>
                </PermissionGate>
            </div>

            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Promotions"
                            value={totalPromotions}
                            prefix={<GiftOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Active"
                            value={activePromotions}
                            prefix={<PercentageOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Products"
                            value={totalProducts}
                            prefix={<ShoppingOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={promotions}
                loading={loading}
                rowKey="promo_id"
                pagination={{
                    current: paginate.page,
                    pageSize: paginate.limit,
                    total: paginate.totalRecords,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `Showing ${range[0]}-${range[1]} of ${total} promotions`,
                    onChange: (page, pageSize) => {
                        fetchPromotions({ page, limit: pageSize });
                    },
                }}
            />

            {/* Create/Edit Modal */}
            <Modal
                title={editingPromotion ? 'Update Promotion' : 'Create New Promotion'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Promotion Name"
                        rules={[
                            { required: true, message: 'Please enter promotion name' },
                            { min: 3, message: 'Name must be at least 3 characters' },
                            { max: 100, message: 'Name cannot exceed 100 characters' }
                        ]}
                    >
                        <Input placeholder="e.g: Summer Sale" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ max: 200, message: 'Description cannot exceed 200 characters' }]}
                    >
                        <TextArea rows={3} placeholder="Detailed description of the promotion" />
                    </Form.Item>

                    <Form.Item
                        name="discount_percent"
                        label="Discount Percentage"
                        rules={[
                            { required: true, message: 'Please enter discount percentage' },
                            { type: 'number', min: 0, max: 100, message: 'Value from 0-100%' }
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Enter % (0-100)"
                            min={0}
                            max={100}
                            formatter={(value) => `${value}%`}
                            parser={(value) => Number(value!.replace('%', '')) as 0 | 100}
                        />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="Validity Period"
                        rules={[{ required: true, message: 'Please select validity period' }]}
                    >
                        <RangePicker
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                        />
                    </Form.Item>

                    <Form.Item
                        name="active"
                        label="Status"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingPromotion ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={() => setModalVisible(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Promotion Details"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={600}
            >
                {viewingPromotion && (
                    <Space direction="vertical" size="middle" className="w-full">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{viewingPromotion.name}</h3>
                            {viewingPromotion.description && (
                                <p className="text-gray-600 mt-1">{viewingPromotion.description}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-gray-500">Discount:</span>
                                <div>
                                    <Tag color="red" className="text-lg font-semibold">
                                        -{viewingPromotion.discount_percent}%
                                    </Tag>
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Products:</span>
                                <div className="font-semibold">
                                    {viewingPromotion.product_count || 0} products
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-500">Validity Period:</span>
                            <div>
                                {dayjs(viewingPromotion.start_date).format('DD/MM/YYYY')} - {' '}
                                {dayjs(viewingPromotion.end_date).format('DD/MM/YYYY')}
                            </div>
                            <div className="mt-2">
                                <Tag color={getStatusColor(viewingPromotion)}>
                                    {getStatusText(viewingPromotion)}
                                </Tag>
                            </div>
                        </div>

                        <div>
                            <Button
                                type="primary"
                                icon={<ShoppingOutlined />}
                                onClick={() => {
                                    setDetailModalVisible(false);
                                    handleViewProducts(viewingPromotion);
                                }}
                            >
                                View Product List
                            </Button>
                        </div>
                    </Space>
                )}
            </Modal>
        </div>
    );
}
