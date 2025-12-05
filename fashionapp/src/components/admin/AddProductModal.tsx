import { useState, useEffect } from 'react';
import { Modal, Input, Table, Button, Space, InputNumber } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import productService from '../../services/productService';
import type { Product, ProductVariant } from '../../types/product';
import { getImageUrl } from '../../utils/imageHelper';
import { useMessage } from '../../App';
interface AddProductModalProps {
    open: boolean;
    onClose: () => void;
    onAddProduct: (
        variant: ProductVariant,
        quantity: number,
        unitPrice: number,
        productInfo: { product_id: number; product_name: string; thumbnail: string }
    ) => void;
}

export default function AddProductModal({ open, onClose, onAddProduct }: AddProductModalProps) {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);
    const message = useMessage();
    useEffect(() => {
        if (open) {
            fetchProducts();
        } else {
            // Reset when closed
            setSearch('');
            setProducts([]);
            setSelectedProduct(null);
            setVariants([]);
            setExpandedRowKeys([]);
        }
    }, [open]);

    const fetchProducts = async (searchTerm = '') => {
        try {
            setLoading(true);
            const response = await productService.getProducts({ search: searchTerm, limit: 50 });
            setProducts(response.products);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        fetchProducts(value);
    };

    const handleExpand = async (expanded: boolean, record: Product) => {
        if (expanded) {
            try {
                const productDetail = await productService.getProductById(record.product_id);
                if (productDetail.variants && productDetail.variants.length > 0) {
                    setVariants(productDetail.variants);
                    setExpandedRowKeys([record.product_id]);
                    setSelectedProduct(record); // Store selected product
                } else {
                    message.warning('This product has no variants');
                }
            } catch (error) {
                message.error('Cannot load variants');
            }
        } else {
            setExpandedRowKeys([]);
            setVariants([]);
            setSelectedProduct(null);
        }
    };

    const handleAddVariant = (variant: ProductVariant, quantity: number, unitPrice: number, product: Product) => {
        if (quantity <= 0) {
            message.warning('Quantity must be greater than 0');
            return;
        }
        if (unitPrice <= 0) {
            message.warning('Unit price must be greater than 0');
            return;
        }
        onAddProduct(variant, quantity, unitPrice, {
            product_id: product.product_id,
            product_name: product.name,
            thumbnail: product.thumbnail
        });
        message.success('Product added to purchase order');
    };

    const productColumns = [
        {
            title: 'Product',
            key: 'product',
            render: (_: any, record: Product) => (
                <Space>
                    <img
                        src={getImageUrl(record.thumbnail)}
                        alt={record.name}
                        style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                            {record.category_name} • {record.brand_name}
                        </div>
                    </div>
                </Space>
            )
        }
    ];

    const expandedRowRender = (record: Product) => {
        const variantColumns = [
            {
                title: 'Color',
                dataIndex: 'color',
                key: 'color',
                render: (color: any) => (
                    <Space>
                        <div
                            style={{
                                width: 20,
                                height: 20,
                                backgroundColor: color.hex_code,
                                border: '1px solid #ddd',
                                borderRadius: 4
                            }}
                        />
                        {color.name}
                    </Space>
                )
            },
            {
                title: 'Size',
                dataIndex: 'size',
                key: 'size',
                render: (size: any) => size.name
            },
            {
                title: 'Selling Price',
                key: 'price',
                render: () => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.base_price)
            },
            {
                title: 'Stock',
                dataIndex: 'stock_quantity',
                key: 'stock_quantity',
                render: (stock: number) => <span style={{ color: stock < 10 ? 'red' : 'inherit' }}>{stock}</span>
            },
            {
                title: 'Import Quantity',
                key: 'quantity',
                width: 150,
                render: (_: any, variant: ProductVariant) => (
                    <InputNumber
                        min={1}
                        defaultValue={1}
                        id={`quantity-${variant.variant_id}`}
                        style={{ width: '100%' }}
                    />
                )
            },
            {
                title: 'Unit Price',
                key: 'unit_price',
                width: 200,
                render: (_: any, variant: ProductVariant) => (
                    <InputNumber
                        min={0}
                        defaultValue={Math.round(record.base_price * 0.7)}
                        id={`price-${variant.variant_id}`}
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                        addonAfter="₫"
                    />
                )
            },
            {
                title: '',
                key: 'action',
                width: 100,
                render: (_: any, variant: ProductVariant) => (
                    <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            const quantityInput = document.getElementById(`quantity-${variant.variant_id}`) as HTMLInputElement;
                            const priceInput = document.getElementById(`price-${variant.variant_id}`) as HTMLInputElement;
                            const quantity = parseInt(quantityInput?.value || '1');
                            const unitPrice = parseInt(priceInput?.value?.replace(/,/g, '') || '0');
                            if (selectedProduct) {
                                handleAddVariant(variant, quantity, unitPrice, selectedProduct);
                            }
                        }}
                    >
                        Add
                    </Button>
                )
            }
        ];

        return (
            <Table
                columns={variantColumns}
                dataSource={variants}
                rowKey="variant_id"
                pagination={false}
                size="small"
            />
        );
    };

    return (
        <Modal
            title="Select product for inventory"
            open={open}
            onCancel={onClose}
            width={1200}
            footer={null}
        >
            <div style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Search products..."
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={handleSearch}
                    onChange={(e) => !e.target.value && handleSearch('')}
                />
            </div>

            <Table
                columns={productColumns}
                dataSource={products}
                rowKey="product_id"
                loading={loading}
                expandable={{
                    expandedRowRender,
                    expandedRowKeys,
                    onExpand: handleExpand,
                    expandRowByClick: true
                }}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
                    showTotal: (total) => `Total ${total} products`
                }}
            />
        </Modal>
    );
}
