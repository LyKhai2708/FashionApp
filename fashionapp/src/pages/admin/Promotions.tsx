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
            message.error(error.message || 'Không thể tải danh sách khuyến mãi');
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
            message.success('Xóa khuyến mãi thành công');
            fetchPromotions();
        } catch (error: any) {
            message.error(error.message || 'Không thể xóa khuyến mãi');
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
                message.info('Chức năng cập nhật chưa được hỗ trợ bởi backend');
            } else {
                await promotionService.createPromotion(payload);
                message.success('Tạo khuyến mãi thành công');
            }

            setModalVisible(false);
            form.resetFields();
            fetchPromotions();
        } catch (error: any) {
            message.error(error.message || 'Không thể lưu khuyến mãi');
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
        if (!promotion.active) return 'Đã vô hiệu';
        const now = dayjs();
        const startDate = dayjs(promotion.start_date);
        const endDate = dayjs(promotion.end_date);

        if (now.isBefore(startDate)) return 'Sắp diễn ra';
        if (now.isAfter(endDate)) return 'Đã kết thúc';
        return 'Đang diễn ra';
    };

    const columns: ColumnsType<Promotion> = [
        {
            title: 'Tên khuyến mãi',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (name) => <span className="font-medium">{name}</span>
        },
        {
            title: 'Giảm giá',
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
            title: 'Sản phẩm',
            dataIndex: 'product_count',
            key: 'product_count',
            width: 100,
            render: (count) => (
                <Badge count={count} showZero color="#1890ff" />
            ),
        },
        {
            title: 'Thời gian',
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
            title: 'Thao tác',
            key: 'actions',
            width: 180,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                        title="Xem chi tiết"
                    />
                    <Button
                        type="text"
                        icon={<ShoppingOutlined />}
                        onClick={() => handleViewProducts(record)}
                        title="Xem sản phẩm"
                    />
                    <PermissionGate permission="promotions.delete">
                        <Popconfirm
                            title="Xóa khuyến mãi này?"
                            description="Bạn có chắc chắn muốn xóa khuyến mãi này không?"
                            onConfirm={() => handleDelete(record.promo_id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okType="danger"
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                title="Xóa"
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
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Khuyến mãi</h1>
                    <p className="text-gray-600 mt-1">Tổng số: {paginate.totalRecords} khuyến mãi</p>
                </div>
                <PermissionGate permission="promotions.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                    >
                        Tạo khuyến mãi mới
                    </Button>
                </PermissionGate>
            </div>

            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Tổng khuyến mãi"
                            value={totalPromotions}
                            prefix={<GiftOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Đang diễn ra"
                            value={activePromotions}
                            prefix={<PercentageOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Tổng sản phẩm"
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
                        `Hiển thị ${range[0]}-${range[1]} của ${total} khuyến mãi`,
                    onChange: (page, pageSize) => {
                        fetchPromotions({ page, limit: pageSize });
                    },
                }}
            />

            {/* Create/Edit Modal */}
            <Modal
                title={editingPromotion ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi mới'}
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
                        label="Tên khuyến mãi"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên khuyến mãi' },
                            { min: 3, message: 'Tên khuyến mãi phải có ít nhất 3 ký tự' },
                            { max: 100, message: 'Tên khuyến mãi không vượt quá 100 ký tự' }
                        ]}
                    >
                        <Input placeholder="VD: Giảm giá mùa hè" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ max: 200, message: 'Mô tả không vượt quá 200 ký tự' }]}
                    >
                        <TextArea rows={3} placeholder="Mô tả chi tiết về khuyến mãi" />
                    </Form.Item>

                    <Form.Item
                        name="discount_percent"
                        label="Phần trăm giảm giá"
                        rules={[
                            { required: true, message: 'Vui lòng nhập phần trăm giảm giá' },
                            { type: 'number', min: 0, max: 100, message: 'Giá trị từ 0-100%' }
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Nhập % (0-100)"
                            min={0}
                            max={100}
                            formatter={(value) => `${value}%`}
                            parser={(value) => Number(value!.replace('%', '')) as 0 | 100}
                        />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="Thời gian hiệu lực"
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian hiệu lực' }]}
                    >
                        <RangePicker
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                        />
                    </Form.Item>

                    <Form.Item
                        name="active"
                        label="Trạng thái"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingPromotion ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                            <Button onClick={() => setModalVisible(false)}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Chi tiết khuyến mãi"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Đóng
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
                                <span className="text-gray-500">Giảm giá:</span>
                                <div>
                                    <Tag color="red" className="text-lg font-semibold">
                                        -{viewingPromotion.discount_percent}%
                                    </Tag>
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Số sản phẩm:</span>
                                <div className="font-semibold">
                                    {viewingPromotion.product_count || 0} sản phẩm
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-500">Thời gian hiệu lực:</span>
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
                                Xem danh sách sản phẩm
                            </Button>
                        </div>
                    </Space>
                )}
            </Modal>
        </div>
    );
}
