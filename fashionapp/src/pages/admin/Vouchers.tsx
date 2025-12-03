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
    Select,
    Popconfirm,
    Card,
    Statistic,
    Row,
    Col
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    GiftOutlined,
    DollarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import voucherService, { type Voucher } from '../../services/voucherService';
import dayjs from 'dayjs';
import { PermissionGate } from '../../components/PermissionGate';
import { useMessage } from '../../App';
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface Paginate {
    totalRecords: number;
    firstPage: number;
    lastPage: number;
    page: number;
    limit: number;
}

export default function Vouchers() {
    const message = useMessage();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
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
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);
    const [form] = Form.useForm();

    const fetchVouchers = async (params?: any) => {
        setLoading(true);
        try {
            const result = await voucherService.getVouchers({
                page: params?.page || paginate.page,
                limit: params?.limit || paginate.limit,
                ...params
            });
            setVouchers(result.vouchers);
            setPaginate(result.metadata);
        } catch (error: any) {
            message.error(error.message || 'Không thể tải danh sách voucher');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const handleCreate = () => {
        setEditingVoucher(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (voucher: Voucher) => {
        setEditingVoucher(voucher);
        form.setFieldsValue({
            ...voucher,
            dateRange: [dayjs(voucher.start_date), dayjs(voucher.end_date)]
        });
        setModalVisible(true);
    };

    const handleView = (voucher: Voucher) => {
        setViewingVoucher(voucher);
        setDetailModalVisible(true);
    };

    const handleDelete = async (voucherId: number) => {
        try {
            await voucherService.deleteVoucher(voucherId);
            message.success('Xóa voucher thành công');
            fetchVouchers();
        } catch (error: any) {
            console.log('🔴 Delete error:', error); // ← Thêm dòng này
            console.log('🔴 Error message:', error.message);
            message.error(error.message || 'Không thể xóa voucher');
        }
    };

    const handleToggleActive = async (voucherId: number, currentActive: boolean) => {
        try {
            await voucherService.toggleVoucherActive(voucherId);
            message.success(currentActive ? 'Đã vô hiệu hóa voucher' : 'Đã kích hoạt voucher');
            fetchVouchers();
        } catch (error: any) {
            message.error(error.message || 'Không thể cập nhật trạng thái voucher');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            const payload: any = {
                start_date: values.dateRange[0].format('YYYY-MM-DD'),
                end_date: values.dateRange[1].format('YYYY-MM-DD'),
                name: values.name,
                description: values.description || null,
                discount_type: values.discount_type,
                discount_value: Number(values.discount_value),
                min_order_amount: values.min_order_amount ? Number(values.min_order_amount) : 0,
                max_discount_amount: values.max_discount_amount ? Number(values.max_discount_amount) : null,
                usage_limit: values.usage_limit ? Number(values.usage_limit) : null,
                user_limit: values.user_limit ? Number(values.user_limit) : 1,
                active: values.active !== undefined ? values.active : true
            };

            if (editingVoucher) {
                await voucherService.updateVoucher(editingVoucher.voucher_id, payload);
                message.success('Cập nhật voucher thành công');
            } else {
                payload.code = values.code;
                payload.active = true;
                await voucherService.createVoucher(payload);
                message.success('Tạo voucher thành công');
            }

            setModalVisible(false);
            form.resetFields();
            fetchVouchers();
        } catch (error: any) {
            message.error(error.message || 'Không thể lưu voucher');
        }
    };

    const getDiscountTypeColor = (type: string) => {
        switch (type) {
            case 'percentage': return 'blue';
            case 'fixed_amount': return 'green';
            case 'free_shipping': return 'orange';
            default: return 'default';
        }
    };

    const getDiscountTypeText = (type: string) => {
        switch (type) {
            case 'percentage': return 'Giảm %';
            case 'fixed_amount': return 'Giảm cố định';
            case 'free_shipping': return 'Miễn phí ship';
            default: return type;
        }
    };

    const getStatusColor = (voucher: Voucher) => {
        if (!voucher.active) return 'red';
        const now = dayjs();
        const endDate = dayjs(voucher.end_date);
        if (now.isAfter(endDate)) return 'red';
        if (now.diff(endDate, 'day') >= -3) return 'orange';
        return 'green';
    };

    const getStatusText = (voucher: Voucher) => {
        if (!voucher.active) return 'Đã vô hiệu';
        const now = dayjs();
        const endDate = dayjs(voucher.end_date);
        if (now.isAfter(endDate)) return 'Đã hết hạn';
        return 'Đang hoạt động';
    };

    const columns: ColumnsType<Voucher> = [
        {
            title: 'Mã voucher',
            dataIndex: 'code',
            key: 'code',
            render: (code) => (
                <Tag color="blue" className="font-mono">
                    {code}
                </Tag>
            ),
        },
        {
            title: 'Tên voucher',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Giảm giá',
            dataIndex: 'discount_value',
            key: 'discount_value',
            width: 180,
            render: (value, record) => (
                <Space direction="vertical" size="small">
                    <Tag color={getDiscountTypeColor(record.discount_type)}>
                        {record.discount_type === 'percentage' ? `${value}%` : `${value.toLocaleString('vi-VN')} VNĐ`}
                    </Tag>
                    <Tag color={getDiscountTypeColor(record.discount_type)}>
                        {getDiscountTypeText(record.discount_type)}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Đơn hàng tối thiểu',
            dataIndex: 'min_order_amount',
            key: 'min_order_amount',
            render: (value) => value > 0 ? `${value.toLocaleString('vi-VN')} VNĐ` : 'Không',
        },
        {
            title: 'Sử dụng',
            key: 'usage',
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    <span>
                        {record.used_count}/{record.usage_limit || '∞'}
                    </span>
                    {record.user_limit > 1 && (
                        <Tag color="purple">Max {record.user_limit}/user</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Thời gian',
            key: 'duration',
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
            title: 'Trạng thái',
            key: 'active',
            align: 'center' as const,
            render: (_, record) => (
                <PermissionGate permission="vouchers.edit">
                    <Popconfirm
                        title={record.active ? 'Vô hiệu hóa voucher?' : 'Kích hoạt voucher?'}
                        description={record.active ? 'Voucher sẽ không thể sử dụng nữa' : 'Voucher sẽ có thể sử dụng lại'}
                        onConfirm={() => handleToggleActive(record.voucher_id, record.active)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                    >
                        <Switch
                            checked={record.active}
                            checkedChildren="Hoạt động"
                            unCheckedChildren="Vô hiệu"
                        />
                    </Popconfirm>
                </PermissionGate>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                    />
                    <PermissionGate permission="vouchers.edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </PermissionGate>
                    <PermissionGate permission="vouchers.delete">
                        <Popconfirm
                            title="Xóa voucher này?"
                            description="Bạn có chắc chắn muốn xóa voucher này không?"
                            onConfirm={() => handleDelete(record.voucher_id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okType="danger"
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Popconfirm>
                    </PermissionGate>
                </Space>
            ),
        },
    ];

    const totalVouchers = vouchers.length;
    const activeVouchers = vouchers.filter(v => v.active).length;
    const usedVouchers = vouchers.filter(v => v.used_count > 0).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Voucher</h1>
                    <p className="text-gray-600 mt-1">Tổng số: {paginate.totalRecords} voucher</p>
                </div>
                <PermissionGate permission="vouchers.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                    >
                        Tạo voucher mới
                    </Button>
                </PermissionGate>
            </div>

            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Tổng voucher"
                            value={totalVouchers}
                            prefix={<GiftOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Đang hoạt động"
                            value={activeVouchers}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Đã sử dụng"
                            value={usedVouchers}
                            prefix={<EditOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={vouchers}
                loading={loading}
                rowKey="voucher_id"
                pagination={{
                    current: paginate.page,
                    pageSize: paginate.limit,
                    total: paginate.totalRecords,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `Hiển thị ${range[0]}-${range[1]} của ${total} voucher`,
                    onChange: (page, pageSize) => {
                        fetchVouchers({ page, limit: pageSize });
                    },
                }}
            />

            <Modal
                title={editingVoucher ? 'Cập nhật voucher' : 'Tạo voucher mới'}
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
                        name="code"
                        label="Mã voucher"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mã voucher' },
                            { pattern: /^[A-Z0-9]+$/, message: 'Mã voucher chỉ chứa chữ hoa và số' },
                            { min: 3, max: 50, message: 'Mã voucher từ 3-50 ký tự' }
                        ]}
                    >
                        <Input
                            placeholder="VD: SUMMER20"
                            style={{ textTransform: 'uppercase' }}
                            disabled={!!editingVoucher}
                        />
                    </Form.Item>
                    {editingVoucher && (
                        <div className="text-xs text-gray-500 -mt-4 mb-4">
                            * Mã voucher không thể thay đổi sau khi tạo
                        </div>
                    )}

                    <Form.Item
                        name="name"
                        label="Tên voucher"
                        rules={[{ required: true, message: 'Vui lòng nhập tên voucher' }]}
                    >
                        <Input placeholder="Tên voucher" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ max: 200, message: 'Mô tả không vượt quá 200 ký tự' }]}
                    >
                        <TextArea rows={3} placeholder="Mô tả chi tiết về voucher" />
                    </Form.Item>

                    <Form.Item
                        name="discount_type"
                        label="Loại giảm giá"
                        rules={[{ required: true, message: 'Vui lòng chọn loại giảm giá' }]}
                    >
                        <Select placeholder="Chọn loại giảm giá">
                            <Option value="percentage">Giảm theo %</Option>
                            <Option value="fixed_amount">Giảm cố định</Option>
                            <Option value="free_shipping">Miễn phí vận chuyển</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.discount_type !== currentValues.discount_type}
                    >
                        {({ getFieldValue }) => {
                            const discountType = getFieldValue('discount_type');
                            return (
                                <Form.Item
                                    name="discount_value"
                                    label="Giá trị giảm giá"
                                    rules={[{ required: true, message: 'Vui lòng nhập giá trị giảm giá' }]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        placeholder={discountType === 'percentage' ? 'Nhập % (0-100)' : 'Nhập số tiền'}
                                        min={0}
                                        max={discountType === 'percentage' ? 100 : undefined}
                                        formatter={(value) => {
                                            if (discountType === 'percentage') {
                                                return `${value}%`;
                                            }
                                            return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                                        }}
                                        parser={(value) => {
                                            if (discountType === 'percentage') {
                                                return value!.replace('%', '');
                                            }
                                            return value!.replace(/\$\s?|(,*)/g, '');
                                        }}
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    <Form.Item
                        name="min_order_amount"
                        label="Giá trị đơn hàng tối thiểu"
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="0"
                            min={0}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="max_discount_amount"
                        label="Giá trị giảm tối đa (nếu giảm %)"
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Không giới hạn"
                            min={0}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="usage_limit"
                        label="Giới hạn sử dụng"
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Không giới hạn"
                            min={1}
                        />
                    </Form.Item>

                    <Form.Item
                        name="user_limit"
                        label="Giới hạn sử dụng/người dùng"
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={1}
                            defaultValue={1}
                        />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="Thời gian hiệu lực"
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian hiệu lực' }]}
                    >
                        <RangePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingVoucher ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                            <Button onClick={() => setModalVisible(false)}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* View Detail Modal */}
            <Modal
                title="Chi tiết voucher"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
            >
                {viewingVoucher && (
                    <Space direction="vertical" size="middle" className="w-full">
                        <div>
                            <Tag color="blue" className="font-mono text-lg px-3 py-1">
                                {viewingVoucher.code}
                            </Tag>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{viewingVoucher.name}</h3>
                            {viewingVoucher.description && (
                                <p className="text-gray-600 mt-1">{viewingVoucher.description}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-gray-500">Loại giảm giá:</span>
                                <div>
                                    <Tag color={getDiscountTypeColor(viewingVoucher.discount_type)}>
                                        {getDiscountTypeText(viewingVoucher.discount_type)}
                                    </Tag>
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Giá trị:</span>
                                <div className="font-semibold">
                                    {viewingVoucher.discount_type === 'percentage'
                                        ? `${viewingVoucher.discount_value}%`
                                        : `${viewingVoucher.discount_value.toLocaleString('vi-VN')} VNĐ`
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-gray-500">Đơn hàng tối thiểu:</span>
                                <div>
                                    {viewingVoucher.min_order_amount > 0
                                        ? `${viewingVoucher.min_order_amount.toLocaleString('vi-VN')} VNĐ`
                                        : 'Không'
                                    }
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Giảm tối đa:</span>
                                <div>
                                    {viewingVoucher.max_discount_amount
                                        ? `${viewingVoucher.max_discount_amount.toLocaleString('vi-VN')} VNĐ`
                                        : 'Không giới hạn'
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-gray-500">Đã sử dụng:</span>
                                <div>
                                    {viewingVoucher.used_count}/{viewingVoucher.usage_limit || '∞'}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Giới hạn/user:</span>
                                <div>{viewingVoucher.user_limit} lần</div>
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-500">Thời gian hiệu lực:</span>
                            <div>
                                {dayjs(viewingVoucher.start_date).format('DD/MM/YYYY')} - {' '}
                                {dayjs(viewingVoucher.end_date).format('DD/MM/YYYY')}
                            </div>
                            <div>
                                <Tag color={getStatusColor(viewingVoucher)}>
                                    {getStatusText(viewingVoucher)}
                                </Tag>
                            </div>
                        </div>
                    </Space>
                )}
            </Modal>
        </div>
    );
}