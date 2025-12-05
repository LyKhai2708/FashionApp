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
    Select,
    Upload,
    message,
    Popconfirm,
    Card,
    Row,
    Col,
    Image
} from 'antd';
import { Tag as TagIcon, Ticket, Folder } from 'lucide-react';
import {
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    UploadOutlined,
    PictureOutlined,
    FileImageOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import bannerService, { type Banner } from '../../services/bannerService';
import promotionService, { type Promotion } from '../../services/promotionService';
import voucherService, { type Voucher } from '../../services/voucherService';
import categoryService, { type Category } from '../../services/categoryService';
import dayjs from 'dayjs';
import { getImageUrl } from '../../utils/imageHelper';
import { PermissionGate } from '../../components/PermissionGate';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Paginate {
    totalRecords: number;
    firstPage: number;
    lastPage: number;
    page: number;
    limit: number;
}

export default function Banners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [paginate, setPaginate] = useState<Paginate>({
        totalRecords: 0,
        firstPage: 1,
        lastPage: 1,
        page: 1,
        limit: 10,
    });

    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [form] = Form.useForm();

    // Data for selects
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form state
    const [bannerType, setBannerType] = useState<string>('custom');
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

    const fetchBanners = async (params?: any) => {
        setLoading(true);
        try {
            const result = await bannerService.getBanners({
                page: params?.page || paginate.page,
                limit: params?.limit || paginate.limit,
                ...params
            });
            setBanners(result.banners);
            setPaginate(result.metadata);
        } catch (error: any) {
            message.error(error.message || 'Cannot load banners');
        } finally {
            setLoading(false);
        }
    };

    const fetchFormData = async () => {
        try {
            const [promoData, voucherData, categoryData] = await Promise.all([
                promotionService.getPromotions({ active: true, limit: 100 }),
                voucherService.getVouchers({ active: true, limit: 100 }),
                categoryService.getAll()
            ]);
            setPromotions(promoData.promotions);
            setVouchers(voucherData.vouchers);
            setCategories(categoryData);
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    };

    useEffect(() => {
        fetchBanners();
        fetchFormData();
    }, []);

    const handleCreate = () => {
        setEditingBanner(null);
        form.resetFields();
        setBannerType('custom');
        setFileList([]);
        setCurrentImageUrl('');
        setModalVisible(true);
    };

    const handleEdit = (banner: Banner) => {
        setEditingBanner(banner);
        setBannerType(banner.banner_type);
        setCurrentImageUrl(banner.image_url);
        setFileList([]);

        form.setFieldsValue({
            title: banner.title,
            alt_text: banner.alt_text,
            banner_type: banner.banner_type,
            promotion_id: banner.promotion_id,
            voucher_id: banner.voucher_id,
            category_id: banner.category_id,
            link_url: banner.link_url,
            link_target: banner.link_target,
            dateRange: banner.start_date && banner.end_date ?
                [dayjs(banner.start_date), dayjs(banner.end_date)] : null,
            status: banner.status,
            position: banner.position,
            display_order: banner.display_order
        });

        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await bannerService.deleteBanner(id);
            message.success('Banner deleted successfully');
            fetchBanners();
        } catch (error: any) {
            message.error(error.message || 'Cannot delete banner');
        }
    };

    const handleBannerTypeChange = (value: string) => {
        setBannerType(value);

        // Auto-fill dates when select promotion/voucher
        if (value === 'promotion') {
            const promoId = form.getFieldValue('promotion_id');
            if (promoId) {
                const promo = promotions.find(p => p.promo_id === promoId);
                if (promo) {
                    form.setFieldsValue({
                        dateRange: [dayjs(promo.start_date), dayjs(promo.end_date)]
                    });
                }
            }
        } else if (value === 'voucher') {
            const voucherId = form.getFieldValue('voucher_id');
            if (voucherId) {
                const voucher = vouchers.find(v => v.voucher_id === voucherId);
                if (voucher) {
                    form.setFieldsValue({
                        dateRange: [dayjs(voucher.start_date), dayjs(voucher.end_date)]
                    });
                }
            }
        }
    };

    const handlePromotionChange = (promoId: number) => {
        const promo = promotions.find(p => p.promo_id === promoId);
        if (promo) {
            form.setFieldsValue({
                dateRange: [dayjs(promo.start_date), dayjs(promo.end_date)]
            });
        }
    };

    const handleVoucherChange = (voucherId: number) => {
        const voucher = vouchers.find(v => v.voucher_id === voucherId);
        if (voucher) {
            form.setFieldsValue({
                dateRange: [dayjs(voucher.start_date), dayjs(voucher.end_date)]
            });
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            const formData = new FormData();

            formData.append('title', values.title);
            if (values.alt_text) formData.append('alt_text', values.alt_text);
            formData.append('banner_type', values.banner_type);

            if (values.promotion_id) formData.append('promotion_id', values.promotion_id);
            if (values.voucher_id) formData.append('voucher_id', values.voucher_id);
            if (values.category_id) formData.append('category_id', values.category_id);
            if (values.link_url) formData.append('link_url', values.link_url);
            formData.append('link_target', values.link_target || '_self');

            if (values.dateRange) {
                formData.append('start_date', values.dateRange[0].format('YYYY-MM-DD'));
                formData.append('end_date', values.dateRange[1].format('YYYY-MM-DD'));
            }

            formData.append('status', values.status || 'draft');
            formData.append('position', values.position || 'home-hero');
            formData.append('display_order', values.display_order || 0);

            if (fileList.length > 0 && fileList[0].originFileObj) {
                formData.append('image', fileList[0].originFileObj);
            }

            if (editingBanner) {
                await bannerService.updateBannerWithImage(editingBanner.banner_id, formData);
                message.success('Banner updated successfully');
            } else {
                await bannerService.createBannerWithImage(formData);
                message.success('Banner created successfully');
            }

            setModalVisible(false);
            form.resetFields();
            fetchBanners();
        } catch (error: any) {
            message.error(error.message || 'Cannot save banner');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'green';
            case 'draft': return 'blue';
            case 'paused': return 'orange';
            case 'expired': return 'red';
            default: return 'default';
        }
    };

    const columns: ColumnsType<Banner> = [
        {
            title: 'Preview',
            dataIndex: 'image_url',
            key: 'image',
            width: 120,
            render: (url) => (
                <Image
                    src={getImageUrl(url)}
                    alt="Banner"
                    width={100}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                />
            )
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: 200
        },
        {
            title: 'Banner Type',
            dataIndex: 'banner_type',
            key: 'type',
            width: 100,
            render: (type) => {
                const colors: any = {
                    promotion: 'magenta',
                    voucher: 'gold',
                    category: 'cyan',
                    custom: 'default'
                };
                return <Tag color={colors[type]}>{type}</Tag>;
            }
        },
        {
            title: 'Details',
            key: 'details',
            width: 180,
            render: (_, record) => {
                if (record.promotion_name) return (
                    <span className="flex items-center gap-1">
                        <TagIcon className="w-3 h-3" /> {record.promotion_name}
                    </span>
                );
                if (record.voucher_code) return (
                    <span className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" /> {record.voucher_code}
                    </span>
                );
                if (record.category_name) return (
                    <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3" /> {record.category_name}
                    </span>
                );
                if (record.link_url) return <span className="text-xs text-gray-500">{record.link_url}</span>;
                return <span className="text-gray-400">-</span>;
            }
        },
        {
            title: 'Position',
            dataIndex: 'position',
            key: 'position',
            width: 100
        },
        {
            title: 'Order',
            dataIndex: 'display_order',
            key: 'order',
            width: 80,
            sorter: (a, b) => a.display_order - b.display_order
        },
        {
            title: 'Start - End Date',
            key: 'dates',
            width: 150,
            render: (_, record) => {
                if (record.start_date && record.end_date) {
                    return (
                        <div className="text-xs">
                            <div>{dayjs(record.start_date).format('DD/MM/YYYY')}</div>
                            <div>{dayjs(record.end_date).format('DD/MM/YYYY')}</div>
                        </div>
                    );
                }
                return <span className="text-gray-400">Always</span>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => (
                <Tag color={getStatusColor(status)}>{status}</Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            fixed: 'right' as 'right',
            render: (_, record) => (
                <Space>
                    <PermissionGate permission="banners.edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </PermissionGate>
                    <PermissionGate permission="banners.delete">
                        <Popconfirm
                            title="Delete banner?"
                            description="Banner will be set to expired status"
                            onConfirm={() => handleDelete(record.banner_id)}
                            okText="Delete"
                            cancelText="Cancel"
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Popconfirm>
                    </PermissionGate>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                    <FileImageOutlined /> Banner Management
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 14, color: '#999' }}>
                        Total: <span style={{ fontWeight: 600, color: '#000' }}>{paginate.totalRecords}</span> banners
                    </div>
                    <PermissionGate permission="banners.create">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                            size="large"
                        >
                            Add Banner
                        </Button>
                    </PermissionGate>
                </div>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={banners}
                    rowKey="banner_id"
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        current: paginate.page,
                        pageSize: paginate.limit,
                        total: paginate.totalRecords,
                        onChange: (page, pageSize) => fetchBanners({ page, limit: pageSize }),
                        showTotal: (total) => `Total ${total} banners`
                    }}
                />
            </Card>

            <Modal
                title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                width={800}
                okText={editingBanner ? 'Update' : 'Create'}
                cancelText="Cancel"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="title"
                                label="Title"
                                rules={[{ required: true, message: 'Enter banner title' }]}
                            >
                                <Input placeholder="e.g: Summer Sale 50%" />
                            </Form.Item>

                            <Form.Item name="alt_text" label="Alt Text (SEO)">
                                <Input placeholder="Image description for SEO" />
                            </Form.Item>

                            <Form.Item
                                name="banner_type"
                                label="Banner Type"
                                rules={[{ required: true }]}
                            >
                                <Select onChange={handleBannerTypeChange}>
                                    <Option value="promotion">Promotion</Option>
                                    <Option value="voucher">Voucher</Option>
                                    <Option value="category">Category</Option>
                                    <Option value="custom">Custom (Static/Link)</Option>
                                </Select>
                            </Form.Item>

                            {bannerType === 'promotion' && (
                                <Form.Item
                                    name="promotion_id"
                                    label="Promotion"
                                    rules={[{ required: true }]}
                                >
                                    <Select onChange={handlePromotionChange}>
                                        {promotions.map(p => (
                                            <Option key={p.promo_id} value={p.promo_id}>
                                                {p.name} ({p.discount_percent}%)
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}

                            {bannerType === 'voucher' && (
                                <Form.Item
                                    name="voucher_id"
                                    label="Voucher"
                                    rules={[{ required: true }]}
                                >
                                    <Select onChange={handleVoucherChange}>
                                        {vouchers.map(v => (
                                            <Option key={v.voucher_id} value={v.voucher_id}>
                                                {v.code} - {v.name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}

                            {bannerType === 'category' && (
                                <Form.Item
                                    name="category_id"
                                    label="Category"
                                    rules={[{ required: true }]}
                                >
                                    <Select>
                                        {categories.map(c => (
                                            <Option key={c.category_id} value={c.category_id}>
                                                {c.category_name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}

                            {(bannerType === 'custom' || bannerType === 'voucher') && (
                                <Form.Item name="link_url" label="Link URL (Optional)">
                                    <Input placeholder="/products or https://..." />
                                </Form.Item>
                            )}

                            <Form.Item name="link_target" label="Link Target">
                                <Select>
                                    <Option value="_self">Same Tab</Option>
                                    <Option value="_blank">New Tab</Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item label="Banner Image" required>
                                {currentImageUrl && fileList.length === 0 && (
                                    <div className="mb-2">
                                        <Image
                                            src={getImageUrl(currentImageUrl)}
                                            alt="Current"
                                            width={200}
                                        />
                                    </div>
                                )}
                                <Upload
                                    listType="picture-card"
                                    fileList={fileList}
                                    onChange={({ fileList }) => setFileList(fileList)}
                                    beforeUpload={() => false}
                                    maxCount={1}
                                >
                                    {fileList.length === 0 && (
                                        <div>
                                            <PictureOutlined />
                                            <div>Upload Image</div>
                                        </div>
                                    )}
                                </Upload>
                            </Form.Item>

                            <Form.Item name="dateRange" label="Display Period">
                                <RangePicker className="w-full" />
                            </Form.Item>

                            <Form.Item name="status" label="Status" initialValue="draft">
                                <Select>
                                    <Option value="draft">Draft</Option>
                                    <Option value="active">Active</Option>
                                    <Option value="paused">Paused</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item name="position" label="Position" initialValue="home-hero">
                                <Input placeholder="home-hero, home-middle..." />
                            </Form.Item>

                            <Form.Item name="display_order" label="Display Order" initialValue={0}>
                                <InputNumber min={0} className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
