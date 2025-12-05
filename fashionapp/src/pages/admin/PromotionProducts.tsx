import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Table,
    Button,
    Space,
    Tag,
    Popconfirm,
    Card,
    Statistic,
    Row,
    Col,
    Modal,
    Select,
    Input,
    Spin
} from 'antd';
import { useMessage } from '../../App';
import {
    ArrowLeftOutlined,
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
    ShoppingOutlined,
    PercentageOutlined,
    DollarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import promotionService, { type Promotion } from '../../services/promotionService';
import productService from '../../services/productService';
import { type Product } from '../../types/product';
import dayjs from 'dayjs';
import { getImageUrl } from '../../utils/imageHelper';

const { Option } = Select;

interface Paginate {
    totalRecords: number;
    firstPage: number;
    lastPage: number;
    page: number;
    limit: number;
}

export default function PromotionProducts() {
    const { promo_id } = useParams<{ promo_id: string }>();
    const navigate = useNavigate();
    const message = useMessage();
    const [promotion, setPromotion] = useState<Promotion | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [paginate, setPaginate] = useState<Paginate>({
        totalRecords: 0,
        firstPage: 1,
        lastPage: 1,
        page: 1,
        limit: 10,
    });

    const [loading, setLoading] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [searchProducts, setSearchProducts] = useState<Product[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

    const fetchPromotion = async () => {
        try {
            const data = await promotionService.getPromotionById(Number(promo_id));
            setPromotion(data);
        } catch (error: any) {
            message.error(error.message || 'Cannot load promotion information');
            navigate('/admin/promotions');
        }
    };

    const fetchProducts = async (params?: any) => {
        setLoading(true);
        try {
            const result = await promotionService.getPromotionProducts(Number(promo_id), {
                page: params?.page || paginate.page,
                limit: params?.limit || paginate.limit,
            });
            setProducts(result.products);
            setPaginate(result.metadata);
        } catch (error: any) {
            message.error(error.message || 'Cannot load products list');
        } finally {
            setLoading(false);
        }
    };

    const searchAvailableProducts = async (keyword: string) => {
        if (!keyword || keyword.trim().length < 2) {
            setSearchProducts([]);
            return;
        }

        setSearchLoading(true);
        try {
            const result = await productService.getProducts({
                page: 1,
                limit: 20,
                search: keyword.trim()
            });
            setSearchProducts(result.products);
        } catch (error: any) {
            message.error(error.message || 'Cannot search products');
        } finally {
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        if (promo_id) {
            fetchPromotion();
            fetchProducts();
        }
    }, [promo_id]);

    const handleAddProduct = async () => {
        if (!selectedProductId) {
            message.warning('Please select a product');
            return;
        }

        try {
            await promotionService.addProductToPromotion(Number(promo_id), selectedProductId);
            message.success('Product added to promotion successfully');
            setAddModalVisible(false);
            setSelectedProductId(null);
            setSearchKeyword('');
            setSearchProducts([]);
            fetchProducts();
            fetchPromotion();
        } catch (error: any) {
            console.error('Add product to promotion error:', error);
            message.error(error.message || 'Cannot add product to promotion');
        }
    };

    const handleRemoveProduct = async (productId: number) => {
        try {
            await promotionService.removeProductFromPromotion(Number(promo_id), productId);
            message.success('Product removed from promotion successfully');
            fetchProducts();
            fetchPromotion();
        } catch (error: any) {
            message.error(error.message || 'Cannot remove product from promotion');
        }
    };

    const columns: ColumnsType<Product> = [
        {
            title: 'Image',
            dataIndex: 'thumbnail',
            key: 'thumbnail',
            width: 80,
            render: (thumbnail) => (
                <img
                    src={getImageUrl(thumbnail)}
                    alt="Product"
                    className="w-16 h-16 object-cover rounded"
                />
            ),
        },
        {
            title: 'Product Name',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (name, record) => (
                <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-gray-500">
                        {record.brand_name} • {record.category_name}
                    </div>
                </div>
            ),
        },
        {
            title: 'Original Price',
            dataIndex: 'base_price',
            key: 'base_price',
            width: 120,
            render: (price) => (
                <span className="text-gray-500 line-through">
                    {price?.toLocaleString('vi-VN')} ₫
                </span>
            ),
        },
        {
            title: 'Discounted Price',
            key: 'discounted_price',
            width: 150,
            render: (_, record) => {
                const discountedPrice = record.base_price * (1 - (promotion?.discount_percent || 0) / 100);
                return (
                    <div>
                        <div className="text-red-600 font-semibold">
                            {discountedPrice.toLocaleString('vi-VN')} ₫
                        </div>
                        <Tag color="red" className="text-xs">
                            -{promotion?.discount_percent}%
                        </Tag>
                    </div>
                );
            },
        },
        {
            title: 'Sold',
            key: 'sold',
            width: 150,
            render: (_, record) => (
                <div>
                    <div className="font-semibold text-blue-600">
                        {record.sold_in_promotion || 0} <span className="text-xs text-gray-500">in promo</span>
                    </div>
                    <div className="text-xs text-gray-500">
                        Total: {record.sold || 0}
                    </div>
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Popconfirm
                    title="Remove product from promotion?"
                    description="Product will no longer be discounted"
                    onConfirm={() => handleRemoveProduct(record.product_id)}
                    okText="Remove"
                    cancelText="Cancel"
                    okType="danger"
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        title="Remove"
                    />
                </Popconfirm>
            ),
        },
    ];

    if (!promotion) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spin size="large" />
            </div>
        );
    }

    const totalProducts = products.length;
    const totalRevenue = products.reduce((sum, p) => {
        const discountedPrice = p.base_price * (1 - (promotion.discount_percent / 100));
        return sum + (discountedPrice * (p.sold_in_promotion || 0));
    }, 0);
    const totalDiscount = products.reduce((sum, p) => {
        const discount = p.base_price * (promotion.discount_percent / 100) * (p.sold_in_promotion || 0);
        return sum + discount;
    }, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/admin/promotions')}
                    >
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{promotion.name}</h1>
                        <p className="text-gray-600 mt-1">
                            {promotion.discount_percent}% off • {' '}
                            {dayjs(promotion.start_date).format('DD/MM/YYYY')} - {dayjs(promotion.end_date).format('DD/MM/YYYY')}
                        </p>
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setAddModalVisible(true)}
                    disabled={!promotion.active}
                >
                    Add Product
                </Button>
            </div>

            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Products"
                            value={totalProducts}
                            prefix={<ShoppingOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Revenue"
                            value={totalRevenue}
                            prefix={<DollarOutlined />}
                            suffix="₫"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Discount for this promotion"
                            value={totalDiscount}
                            prefix={<PercentageOutlined />}
                            suffix="₫"
                            precision={0}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={products}
                loading={loading}
                rowKey="product_id"
                pagination={{
                    current: paginate.page,
                    pageSize: paginate.limit,
                    total: paginate.totalRecords,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `Showing ${range[0]}-${range[1]} of ${total} products`,
                    onChange: (page, pageSize) => {
                        fetchProducts({ page, limit: pageSize });
                    },
                }}
            />

            {/* Add Product Modal */}
            <Modal
                title="Add Product to Promotion"
                open={addModalVisible}
                onCancel={() => {
                    setAddModalVisible(false);
                    setSelectedProductId(null);
                    setSearchKeyword('');
                    setSearchProducts([]);
                }}
                onOk={handleAddProduct}
                okText="Add"
                cancelText="Cancel"
                width={600}
            >
                <Space direction="vertical" className="w-full" size="middle">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Products
                        </label>
                        <Input
                            placeholder="Enter product name (minimum 2 characters)"
                            prefix={<SearchOutlined />}
                            value={searchKeyword}
                            onChange={(e) => {
                                setSearchKeyword(e.target.value);
                                searchAvailableProducts(e.target.value);
                            }}
                            allowClear
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Product
                        </label>
                        <Select
                            showSearch
                            placeholder="Select product from search results"
                            style={{ width: '100%' }}
                            value={selectedProductId}
                            onChange={setSelectedProductId}
                            loading={searchLoading}
                            filterOption={false}
                            optionLabelProp="label"
                            notFoundContent={
                                searchLoading ? <Spin size="small" /> :
                                    searchKeyword.length < 2 ? 'Enter at least 2 characters to search' :
                                        'No products found'
                            }
                        >
                            {searchProducts.map((product) => (
                                <Option
                                    key={product.product_id}
                                    value={product.product_id}
                                    label={product.name}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                        <img
                                            src={getImageUrl(product.thumbnail)}
                                            alt={product.name}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                flexShrink: 0
                                            }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {product.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>
                                                {product.base_price?.toLocaleString('vi-VN')} ₫
                                            </div>
                                        </div>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </div>

                    {selectedProductId && (
                        <div className="bg-blue-50 p-3 rounded">
                            <div className="text-sm text-blue-800">
                                <strong>Note:</strong> Product must not have another promotion with overlapping dates.
                                Backend will automatically check and return an error if there is a conflict.
                            </div>
                        </div>
                    )}
                </Space>
            </Modal>
        </div>
    );
}
