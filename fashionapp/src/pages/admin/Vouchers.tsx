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
            message.error(error.message || 'Cannot load vouchers');
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
            message.success('Voucher deleted successfully');
            fetchVouchers();
        } catch (error: any) {
            console.log('🔴 Delete error:', error); // ← Thêm dòng này
            console.log('🔴 Error message:', error.message);
            message.error(error.message || 'Cannot delete voucher');
        }
    };

    const handleToggleActive = async (voucherId: number, currentActive: boolean) => {
        try {
            await voucherService.toggleVoucherActive(voucherId);
            message.success(currentActive ? 'Voucher disabled' : 'Voucher enabled');
            fetchVouchers();
        } catch (error: any) {
            message.error(error.message || 'Cannot update voucher status');
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
                discount_value: values.discount_type === 'free_shipping' ? 0 : Number(values.discount_value),
                min_order_amount: values.min_order_amount ? Number(values.min_order_amount) : 0,
                max_discount_amount: values.max_discount_amount ? Number(values.max_discount_amount) : null,
                usage_limit: values.usage_limit ? Number(values.usage_limit) : null,
                user_limit: values.user_limit ? Number(values.user_limit) : 1,
                active: values.active !== undefined ? values.active : true
            };

            if (editingVoucher) {
                await voucherService.updateVoucher(editingVoucher.voucher_id, payload);
                message.success('Voucher updated successfully');
            } else {
                payload.code = values.code;
                payload.active = true;
                await voucherService.createVoucher(payload);
                message.success('Voucher created successfully');
            }

            setModalVisible(false);
            form.resetFields();
            fetchVouchers();
        } catch (error: any) {
            message.error(error.message || 'Cannot save voucher');
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
            case 'percentage': return 'Percentage';
            case 'fixed_amount': return 'Fixed Amount';
            case 'free_shipping': return 'Free Shipping';
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
        if (!voucher.active) return 'Disabled';
        const now = dayjs();
        const endDate = dayjs(voucher.end_date);
        if (now.isAfter(endDate)) return 'Expired';
        return 'Active';
    };

    const columns: ColumnsType<Voucher> = [
        {
            title: 'Voucher Code',
            dataIndex: 'code',
            key: 'code',
            render: (code) => (
                <Tag color="blue" className="font-mono">
                    {code}
                </Tag>
            ),
        },
        {
            title: 'Voucher Name',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Discount',
            dataIndex: 'discount_value',
            key: 'discount_value',
            width: 180,
            render: (value, record) => (
                <Space direction="vertical" size="small">
                    <Tag color={getDiscountTypeColor(record.discount_type)}>
                        {record.discount_type === 'percentage'
                            ? `${value}%`
                            : record.discount_type === 'free_shipping'
                                ? 'Free Ship'
                                : `${value.toLocaleString('vi-VN')} VNĐ`
                        }
                    </Tag>
                    <Tag color={getDiscountTypeColor(record.discount_type)}>
                        {getDiscountTypeText(record.discount_type)}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Min Order',
            dataIndex: 'min_order_amount',
            key: 'min_order_amount',
            render: (value) => value > 0 ? `${value.toLocaleString('vi-VN')} VND` : 'None',
        },
        {
            title: 'Usage',
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
            title: 'Duration',
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
            title: 'Status',
            key: 'active',
            align: 'center' as const,
            render: (_, record) => (
                <PermissionGate permission="vouchers.edit">
                    <Popconfirm
                        title={record.active ? 'Disable voucher?' : 'Enable voucher?'}
                        description={record.active ? 'Voucher will no longer be usable' : 'Voucher will be usable again'}
                        onConfirm={() => handleToggleActive(record.voucher_id, record.active)}
                        okText="Confirm"
                        cancelText="Cancel"
                    >
                        <Switch
                            checked={record.active}
                            checkedChildren="Active"
                            unCheckedChildren="Disabled"
                        />
                    </Popconfirm>
                </PermissionGate>
            ),
        },
        {
            title: 'Actions',
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
                            title="Delete this voucher?"
                            description="Are you sure you want to delete this voucher?"
                            onConfirm={() => handleDelete(record.voucher_id)}
                            okText="Delete"
                            cancelText="Cancel"
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
                    <h1 className="text-2xl font-bold text-gray-900">Voucher Management</h1>
                    <p className="text-gray-600 mt-1">Total: {paginate.totalRecords} vouchers</p>
                </div>
                <PermissionGate permission="vouchers.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                    >
                        Create New Voucher
                    </Button>
                </PermissionGate>
            </div>

            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Vouchers"
                            value={totalVouchers}
                            prefix={<GiftOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Active"
                            value={activeVouchers}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Used"
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
                        `Showing ${range[0]}-${range[1]} of ${total} vouchers`,
                    onChange: (page, pageSize) => {
                        fetchVouchers({ page, limit: pageSize });
                    },
                }}
            />

            <Modal
                title={editingVoucher ? 'Update Voucher' : 'Create New Voucher'}
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
                        label="Voucher Code"
                        rules={[
                            { required: true, message: 'Please enter voucher code' },
                            { pattern: /^[A-Z0-9]+$/, message: 'Code must contain only uppercase letters and numbers' },
                            { min: 3, max: 50, message: 'Code must be 3-50 characters' }
                        ]}
                    >
                        <Input
                            placeholder="e.g: SUMMER20"
                            style={{ textTransform: 'uppercase' }}
                            disabled={!!editingVoucher}
                        />
                    </Form.Item>
                    {editingVoucher && (
                        <div className="text-xs text-gray-500 -mt-4 mb-4">
                            * Voucher code cannot be changed after creation
                        </div>
                    )}

                    <Form.Item
                        name="name"
                        label="Voucher Name"
                        rules={[{ required: true, message: 'Please enter voucher name' }]}
                    >
                        <Input placeholder="Voucher name" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ max: 200, message: 'Description cannot exceed 200 characters' }]}
                    >
                        <TextArea rows={3} placeholder="Detailed description of the voucher" />
                    </Form.Item>

                    <Form.Item
                        name="discount_type"
                        label="Discount Type"
                        rules={[{ required: true, message: 'Please select discount type' }]}
                    >
                        <Select placeholder="Select discount type">
                            <Option value="percentage">Percentage</Option>
                            <Option value="fixed_amount">Fixed Amount</Option>
                            <Option value="free_shipping">Free Shipping</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.discount_type !== currentValues.discount_type}
                    >
                        {({ getFieldValue }) => {
                            const discountType = getFieldValue('discount_type');
                            if (discountType === 'free_shipping') {
                                return null;
                            }
                            return (
                                <Form.Item
                                    name="discount_value"
                                    label="Discount Value"
                                    rules={[{ required: true, message: 'Please enter discount value' }]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        placeholder={discountType === 'percentage' ? 'Enter % (0-100)' : 'Enter amount'}
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
                        label="Minimum Order Value"
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
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.discount_type !== currentValues.discount_type}
                    >
                        {({ getFieldValue }) => {
                            const discountType = getFieldValue('discount_type');
                            const label = discountType === 'free_shipping'
                                ? 'Maximum Free Ship Amount'
                                : 'Maximum Discount';
                            return (
                                <Form.Item
                                    name="max_discount_amount"
                                    label={label}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        placeholder="No limit"
                                        min={0}
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    <Form.Item
                        name="usage_limit"
                        label="Usage Limit"
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="No limit"
                            min={1}
                        />
                    </Form.Item>

                    <Form.Item
                        name="user_limit"
                        label="Usage Limit Per User"
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={1}
                            defaultValue={1}
                        />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="Validity Period"
                        rules={[{ required: true, message: 'Please select validity period' }]}
                    >
                        <RangePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingVoucher ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={() => setModalVisible(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* View Detail Modal */}
            <Modal
                title="Voucher Details"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Close
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
                                <span className="text-gray-500">Discount Type:</span>
                                <div>
                                    <Tag color={getDiscountTypeColor(viewingVoucher.discount_type)}>
                                        {getDiscountTypeText(viewingVoucher.discount_type)}
                                    </Tag>
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Value:</span>
                                <div className="font-semibold">
                                    {viewingVoucher.discount_type === 'percentage'
                                        ? `${viewingVoucher.discount_value}%`
                                        : viewingVoucher.discount_type === 'free_shipping'
                                            ? 'Free Shipping'
                                            : `${viewingVoucher.discount_value.toLocaleString('vi-VN')} VND`
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-gray-500">Minimum Order:</span>
                                <div>
                                    {viewingVoucher.min_order_amount > 0
                                        ? `${viewingVoucher.min_order_amount.toLocaleString('vi-VN')} VND`
                                        : 'None'
                                    }
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Max Discount:</span>
                                <div>
                                    {viewingVoucher.max_discount_amount
                                        ? `${viewingVoucher.max_discount_amount.toLocaleString('vi-VN')} VND`
                                        : 'No limit'
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-gray-500">Used:</span>
                                <div>
                                    {viewingVoucher.used_count}/{viewingVoucher.usage_limit || '∞'}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Limit/user:</span>
                                <div>{viewingVoucher.user_limit} times</div>
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-500">Validity Period:</span>
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