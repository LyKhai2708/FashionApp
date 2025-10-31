import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Form,
    Input,
    InputNumber,
    Select,
    Button,
    Card,
    Space,
    Divider,
    Row,
    Col,
    Typography,
    Tag,
    Spin,
    Table,
    Steps,
    Upload,
    Image,
    Tooltip,
    Switch,
    Modal,
    Popconfirm
} from 'antd';
import {
    PlusOutlined,
    ArrowLeftOutlined,
    DeleteOutlined,
    StarOutlined,
    StarFilled,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import brandService from '../../services/brandService';
import categoryService, { type Category } from '../../services/categoryService';
import colorService from '../../services/colorService';
import sizeService from '../../services/sizeService';
import productService from '../../services/productService';
import { getImageUrl } from '../../utils/imageHelper';
import { useMessage } from '../../App';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Color {
    color_id: number;
    name: string;
    hex_code: string;
}

interface Size {
    size_id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Variant {
    color_id: number;
    size_id: number;
    stock_quantity: number;
    variant_id?: number;
    active: number;
}

interface ColorVariants {
    color_id: number;
    variants: Variant[];
    hasExistingVariants: boolean;
}

interface ExistingImage {
    image_url: string;
    is_primary: boolean;
    display_order: number;
    color_id: number;
}

interface ColorImages {
    color_id: number;
    existingImages: ExistingImage[];
    newImages: UploadFile[];
}

export default function EditProduct() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const message = useMessage();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [colors, setColors] = useState<Color[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);

    const [currentThumbnail, setCurrentThumbnail] = useState<string>('');
    const [newThumbnailFile, setNewThumbnailFile] = useState<UploadFile[]>([]);
    
    const [colorVariants, setColorVariants] = useState<ColorVariants[]>([]);
    
    const [colorImages, setColorImages] = useState<ColorImages[]>([]);
    const [deletedImages, setDeletedImages] = useState<string[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [categoriesData, brandsData, colorsData, sizesData] = await Promise.all([
                    categoryService.getLeafCategories(),
                    brandService.getBrands(),
                    colorService.getColors(),
                    sizeService.getSizes()
                ]);

                setCategories(categoriesData);
                setBrands(brandsData);
                setColors(colorsData);
                setSizes(sizesData);

                if (id) {
                    await loadProduct(Number(id));
                }
            } catch (error) {
                message.error('Không thể tải dữ liệu');
                navigate('/admin/products');
            } finally {
                setPageLoading(false);
            }
        };

        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadProduct = async (productId: number) => {
        try {
            const product = await productService.getProductById(productId);

            form.setFieldsValue({
                name: product.name,
                description: product.description,
                base_price: product.base_price,
                category_id: product.category_id,
                brand_id: product.brand_id,
            });

            setCurrentThumbnail(product.thumbnail);

            const colorMap = new Map<number, ColorVariants>();
            const imageMap = new Map<number, ExistingImage[]>();

            product.variants?.forEach(variant => {
                const colorId = variant.color.color_id;

                if (!colorMap.has(colorId)) {
                    colorMap.set(colorId, {
                        color_id: colorId,
                        variants: [],
                        hasExistingVariants: true
                    });
                }

                const colorVariant = colorMap.get(colorId)!;
                colorVariant.variants.push({
                    color_id: colorId,
                    size_id: variant.size.size_id,
                    stock_quantity: variant.stock_quantity,
                    variant_id: variant.variant_id,
                    active: variant.active
                });

                if (variant.color.images && variant.color.images.length > 0 && !imageMap.has(colorId)) {
                    imageMap.set(colorId, variant.color.images.map(img => ({
                        image_url: img.image_url,
                        is_primary: img.is_primary,
                        display_order: img.display_order,
                        color_id: colorId
                    })));
                }
            });

            const colorVariantsArray = Array.from(colorMap.values());
            setColorVariants(colorVariantsArray);

            const colorImagesArray = Array.from(imageMap.entries()).map(([color_id, images]) => ({
                color_id,
                existingImages: images.sort((a, b) => a.display_order - b.display_order),
                newImages: []
            }));
            setColorImages(colorImagesArray);

        } catch (error: any) {
            message.error(error.message || 'Không thể tải thông tin sản phẩm');
            navigate('/admin/products');
        }
    };

    const handleAddColor = (colorId: number) => {
        const existing = colorVariants.find(cv => cv.color_id === colorId);
        if (existing) return;

        setColorVariants(prev => [...prev, {
            color_id: colorId,
            variants: [],
            hasExistingVariants: false
        }]);

        setColorImages(prev => [...prev, {
            color_id: colorId,
            existingImages: [],
            newImages: []
        }]);
    };

    const handleRemoveColor = (colorId: number) => {
        const colorVariant = colorVariants.find(cv => cv.color_id === colorId);
        if (!colorVariant || colorVariant.hasExistingVariants) {
            message.error('Không thể xóa màu đã có sản phẩm');
            return;
        }

        setColorVariants(prev => prev.filter(cv => cv.color_id !== colorId));
        setColorImages(prev => prev.filter(ci => ci.color_id !== colorId));
    };

    const handleAddSize = (colorId: number, sizeId: number) => {
        setColorVariants(prev =>
            prev.map(cv => {
                if (cv.color_id !== colorId) return cv;

                const exists = cv.variants.some(v => v.size_id === sizeId);
                if (exists) return cv;

                return {
                    ...cv,
                    variants: [...cv.variants, {
                        color_id: colorId,
                        size_id: sizeId,
                        stock_quantity: 0,
                        active: 1
                    }]
                };
            })
        );
    };

    const handleStockChange = (colorId: number, sizeId: number, value: number | null) => {
        setColorVariants(prev =>
            prev.map(cv => {
                if (cv.color_id !== colorId) return cv;

                return {
                    ...cv,
                    variants: cv.variants.map(v =>
                        v.size_id === sizeId
                            ? { ...v, stock_quantity: value || 0 }
                            : v
                    )
                };
            })
        );
    };

    const handleVariantActiveToggle = (colorId: number, sizeId: number, checked: boolean) => {
        setColorVariants(prev =>
            prev.map(cv => {
                if (cv.color_id !== colorId) return cv;

                return {
                    ...cv,
                    variants: cv.variants.map(v =>
                        v.size_id === sizeId
                            ? { ...v, active: checked ? 1 : 0 }
                            : v
                    )
                };
            })
        );
    };

    const handleDeleteNewVariant = (colorId: number, sizeId: number) => {
        setColorVariants(prev =>
            prev.map(cv => {
                if (cv.color_id !== colorId) return cv;

                return {
                    ...cv,
                    variants: cv.variants.filter(v => v.size_id !== sizeId)
                };
            })
        );
    };

    const handleThumbnailChange: UploadProps['onChange'] = ({ fileList }) => {
        setNewThumbnailFile(fileList.slice(-1));
    };

    const handleDeleteExistingImage = (colorId: number, imageUrl: string) => {
        setColorImages(prev =>
            prev.map(ci =>
                ci.color_id === colorId
                    ? {
                        ...ci,
                        existingImages: ci.existingImages.filter(img => img.image_url !== imageUrl)
                    }
                    : ci
            )
        );
        setDeletedImages(prev => [...prev, imageUrl]);
    };

    const handleSetPrimaryImage = (colorId: number, imageUrl: string) => {
        setColorImages(prev =>
            prev.map(ci =>
                ci.color_id === colorId
                    ? {
                        ...ci,
                        existingImages: ci.existingImages.map(img => ({
                            ...img,
                            is_primary: img.image_url === imageUrl
                        }))
                    }
                    : ci
            )
        );
    };

    const handleColorImageChange = (colorId: number, fileList: UploadFile[]) => {
        setColorImages(prev =>
            prev.map(ci =>
                ci.color_id === colorId
                    ? { ...ci, newImages: fileList }
                    : ci
            )
        );
    };

    const handleMoveImage = (colorId: number, fromIndex: number, toIndex: number) => {
        setColorImages(prev =>
            prev.map(ci => {
                if (ci.color_id !== colorId) return ci;

                const newExisting = [...ci.existingImages];
                const [moved] = newExisting.splice(fromIndex, 1);
                newExisting.splice(toIndex, 0, moved);

                return {
                    ...ci,
                    existingImages: newExisting.map((img, idx) => ({
                        ...img,
                        display_order: idx + 1
                    }))
                };
            })
        );
    };

    const handleSubmit = async (values: any) => {
        try {
            const allVariants = colorVariants.flatMap(cv => cv.variants);
            if (allVariants.length === 0) {
                message.error('Phải có ít nhất 1 variant');
                return;
            }

            const hasActiveVariant = allVariants.some(v => v.active === 1);
            if (!hasActiveVariant) {
                message.error('Phải có ít nhất 1 variant active');
                return;
            }

            const emptyColors = colorVariants.filter(cv => cv.variants.length === 0);
            if (emptyColors.length > 0) {
                const colorNames = emptyColors
                    .map(cv => colors.find(c => c.color_id === cv.color_id)?.name)
                    .join(', ');
                message.error(`Vui lòng thêm size cho màu: ${colorNames}`);
                return;
            }

            const colorsWithoutImages = colorVariants.filter(cv => {
                const ci = colorImages.find(img => img.color_id === cv.color_id);
                const totalImages = (ci?.existingImages.length || 0) + (ci?.newImages.length || 0);
                return totalImages === 0;
            });

            if (colorsWithoutImages.length > 0) {
                const colorNames = colorsWithoutImages
                    .map(cv => colors.find(c => c.color_id === cv.color_id)?.name)
                    .join(', ');
                message.error(`Mỗi màu phải có ít nhất 1 ảnh. Thiếu ảnh: ${colorNames}`);
                return;
            }

            setLoading(true);

            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('description', values.description || '');
            formData.append('base_price', values.base_price.toString());
            formData.append('category_id', values.category_id.toString());
            formData.append('brand_id', values.brand_id.toString());

            formData.append('variants', JSON.stringify(allVariants));

            if (newThumbnailFile.length > 0 && newThumbnailFile[0].originFileObj) {
                formData.append('images', newThumbnailFile[0].originFileObj);
                formData.append('new_thumbnail', 'true');
            } else {
                formData.append('new_thumbnail', 'false');
            }

            const imageColors: number[] = [];
            colorImages.forEach(ci => {
                ci.newImages.forEach(img => {
                    if (img.originFileObj) {
                        formData.append('images', img.originFileObj);
                        imageColors.push(ci.color_id);
                    }
                });
            });

            formData.append('image_colors', JSON.stringify(imageColors));
            formData.append('deleted_images', JSON.stringify(deletedImages));

            const updatedImages = colorImages.flatMap(ci =>
                ci.existingImages.map(img => ({
                    image_url: img.image_url,
                    is_primary: img.is_primary,
                    display_order: img.display_order
                }))
            );
            formData.append('updated_images', JSON.stringify(updatedImages));

            await productService.updateProduct(Number(id), formData);

            message.success('Cập nhật sản phẩm thành công!');
            navigate('/admin/products');
        } catch (error: any) {
            console.error('Update product error:', error);
            message.error(error.message || 'Không thể cập nhật sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleHardDelete = async () => {
        try {
            setLoading(true);
            await productService.hardDeleteProduct(Number(id));
            message.success('Xóa sản phẩm thành công!');
            navigate('/admin/products');
        } catch (error: any) {
            console.error('Hard delete product error:', error);
            message.error(error.message || 'Không thể xóa sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const renderVariantsTable = (colorId: number) => {
        const color = colors.find(c => c.color_id === colorId);
        const cv = colorVariants.find(cv => cv.color_id === colorId);
        if (!cv) return null;

        const columns = [
            {
                title: 'Size',
                dataIndex: 'size_id',
                key: 'size_id',
                render: (sizeId: number) => {
                    const size = sizes.find(s => s.size_id === sizeId);
                    return <Tag color="blue">{size?.name}</Tag>;
                }
            },
            {
                title: 'Số lượng',
                dataIndex: 'stock_quantity',
                key: 'stock_quantity',
                render: (_: any, record: Variant) => (
                    <InputNumber
                        min={0}
                        value={record.stock_quantity}
                        onChange={(value) => handleStockChange(colorId, record.size_id, value)}
                        style={{ width: '100%' }}
                        disabled={record.active === 0}
                    />
                )
            },
            {
                title: 'Thao tác',
                key: 'actions',
                width: 150,
                render: (_: any, record: Variant) => {
                    const isExisting = record.variant_id !== undefined;
                    
                    if (isExisting) {
                        return (
                            <Switch
                                checked={record.active === 1}
                                onChange={(checked) => handleVariantActiveToggle(colorId, record.size_id, checked)}
                                checkedChildren="Active"
                                unCheckedChildren="Inactive"
                            />
                        );
                    } else {
                        return (
                            <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteNewVariant(colorId, record.size_id)}
                            >
                                Xóa
                            </Button>
                        );
                    }
                }
            }
        ];

        const availableSizes = sizes.filter(size => 
            !cv.variants.some(v => v.size_id === size.size_id)
        );

        return (
            <Card
                key={colorId}
                size="small"
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: color?.hex_code,
                                    border: '2px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Text strong style={{ fontSize: 15 }}>{color?.name}</Text>
                            {cv.variants.length > 0 && (
                                <Tag color="green">
                                    {cv.variants.filter(v => v.active === 1).length} active / {cv.variants.length} total
                                </Tag>
                            )}
                        </div>
                        {!cv.hasExistingVariants && (
                            <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveColor(colorId)}
                            >
                                Xóa màu
                            </Button>
                        )}
                    </div>
                }
                style={{
                    marginBottom: 16,
                    background: '#fafafa',
                    border: '1px solid #e8e8e8'
                }}
                headStyle={{
                    background: 'white',
                    borderBottom: '2px solid #f0f0f0'
                }}
            >
                {availableSizes.length > 0 && (
                    <div style={{
                        marginBottom: 16,
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #f0f0f0'
                    }}>
                        <Text strong style={{ display: 'block', marginBottom: 8, color: '#595959' }}>
                            Thêm size:
                        </Text>
                        <Select
                            placeholder="Chọn size để thêm"
                            onChange={(sizeId) => handleAddSize(colorId, sizeId)}
                            value={null}
                            style={{ width: '100%' }}
                            size="large"
                        >
                            {availableSizes.map(size => (
                                <Select.Option key={size.size_id} value={size.size_id}>
                                    <Tag color="blue">{size.name}</Tag>
                                </Select.Option>
                            ))}
                        </Select>
                    </div>
                )}

                {cv.variants.length > 0 ? (
                    <div style={{
                        background: 'white',
                        borderRadius: '6px',
                        overflow: 'hidden'
                    }}>
                        <Table
                            dataSource={cv.variants}
                            columns={columns}
                            pagination={false}
                            rowKey={(record) => `${record.color_id}-${record.size_id}`}
                            size="small"
                        />
                    </div>
                ) : (
                    <div style={{
                        padding: '32px',
                        textAlign: 'center',
                        background: 'white',
                        borderRadius: '6px',
                        border: '2px dashed #d9d9d9'
                    }}>
                        <Text type="secondary">
                            Chọn size ở trên để thêm variant
                        </Text>
                    </div>
                )}
            </Card>
        );
    };

    const renderColorImages = (colorId: number) => {
        const color = colors.find(c => c.color_id === colorId);
        const ci = colorImages.find(ci => ci.color_id === colorId);

        if (!ci) return null;

        return (
            <div key={colorId} style={{
                marginBottom: 24,
                padding: '16px',
                background: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #f0f0f0'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: 12
                }}>
                    <div
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: color?.hex_code,
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    />
                    <Text strong style={{ fontSize: 15 }}>{color?.name}</Text>
                    <Tag color="blue">
                        {ci.existingImages.length + ci.newImages.length} ảnh
                    </Tag>
                </div>

                {ci.existingImages.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Ảnh hiện có:
                        </Text>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {ci.existingImages.map((img, index) => (
                                <div
                                    key={img.image_url}
                                    style={{
                                        position: 'relative',
                                        width: 104,
                                        height: 104,
                                        border: img.is_primary ? '3px solid #1890ff' : '1px solid #d9d9d9',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Image
                                        src={getImageUrl(img.image_url)}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        preview
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        display: 'flex',
                                        gap: '4px'
                                    }}>
                                        <Tooltip title={img.is_primary ? "Ảnh chính" : "Đặt làm ảnh chính"}>
                                            <Button
                                                size="small"
                                                type={img.is_primary ? "primary" : "default"}
                                                icon={img.is_primary ? <StarFilled /> : <StarOutlined />}
                                                onClick={() => handleSetPrimaryImage(colorId, img.image_url)}
                                            />
                                        </Tooltip>
                                        <Button
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleDeleteExistingImage(colorId, img.image_url)}
                                        />
                                    </div>
                                    {index > 0 && (
                                        <Button
                                            size="small"
                                            style={{ position: 'absolute', bottom: 4, left: 4 }}
                                            onClick={() => handleMoveImage(colorId, index, index - 1)}
                                        >
                                            ←
                                        </Button>
                                    )}
                                    {index < ci.existingImages.length - 1 && (
                                        <Button
                                            size="small"
                                            style={{ position: 'absolute', bottom: 4, right: 4 }}
                                            onClick={() => handleMoveImage(colorId, index, index + 1)}
                                        >
                                            →
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Thêm ảnh mới:
                    </Text>
                    <Upload
                        listType="picture-card"
                        fileList={ci.newImages}
                        onChange={({ fileList }) => handleColorImageChange(colorId, fileList)}
                        beforeUpload={() => false}
                        multiple
                    >
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Thêm ảnh</div>
                        </div>
                    </Upload>
                </div>
            </div>
        );
    };

    if (pageLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '24px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/admin/products')}
                        style={{ marginBottom: 16 }}
                        type="text"
                    >
                        Quay lại danh sách
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                            <Title level={2} style={{ margin: 0 }}>
                                Sửa sản phẩm
                            </Title>
                            <Text type="secondary">Cập nhật thông tin sản phẩm</Text>
                        </div>
                    </div>

                    <Steps
                        current={-1}
                        style={{ marginTop: 32 }}
                        items={[
                            { title: 'Thông tin cơ bản' },
                            { title: 'Hình ảnh & Màu sắc' },
                            { title: 'Quản lý tồn kho' },
                            { title: 'Hoàn tất' }
                        ]}
                    />
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Row gutter={24}>
                        <Col xs={24} lg={14}>
                            <Card
                                title="Thông tin cơ bản"
                                style={{
                                    marginBottom: 24,
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                }}
                                headStyle={{ borderBottom: '2px solid #f0f0f0' }}
                            >
                                <div style={{ marginBottom: 24 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        Ảnh thumbnail hiện tại:
                                    </Text>
                                    {currentThumbnail && (
                                        <Image
                                            src={getImageUrl(currentThumbnail)}
                                            alt="Current thumbnail"
                                            style={{ width: 150, height: 200, objectFit: 'cover', borderRadius: '8px' }}
                                        />
                                    )}
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        Thay đổi thumbnail:
                                    </Text>
                                    <Upload
                                        listType="picture-card"
                                        fileList={newThumbnailFile}
                                        onChange={handleThumbnailChange}
                                        beforeUpload={() => false}
                                        maxCount={1}
                                    >
                                        {newThumbnailFile.length === 0 && (
                                            <div>
                                                <PlusOutlined />
                                                <div style={{ marginTop: 8 }}>Chọn ảnh mới</div>
                                            </div>
                                        )}
                                    </Upload>
                                </div>

                                <Divider />

                                <Form.Item
                                    label="Tên sản phẩm"
                                    name="name"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                                >
                                    <Input size="large" placeholder="Nhập tên sản phẩm" />
                                </Form.Item>

                                <Form.Item
                                    label="Mô tả"
                                    name="description"
                                >
                                    <TextArea rows={4} placeholder="Nhập mô tả sản phẩm" />
                                </Form.Item>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Danh mục"
                                            name="category_id"
                                            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                                        >
                                            <Select size="large" placeholder="Chọn danh mục">
                                                {categories.map(cat => (
                                                    <Select.Option key={cat.category_id} value={cat.category_id}>
                                                        {cat.category_name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Thương hiệu"
                                            name="brand_id"
                                            rules={[{ required: true, message: 'Vui lòng chọn thương hiệu' }]}
                                        >
                                            <Select size="large" placeholder="Chọn thương hiệu">
                                                {brands.map(brand => (
                                                    <Select.Option key={brand.id} value={brand.id}>
                                                        {brand.name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    label="Giá sản phẩm (VNĐ)"
                                    name="base_price"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập giá' },
                                        { type: 'number', min: 0, message: 'Giá phải lớn hơn 0' }
                                    ]}
                                >
                                    <InputNumber
                                        size="large"
                                        style={{ width: '100%' }}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                                        placeholder="Nhập giá sản phẩm"
                                    />
                                </Form.Item>
                            </Card>

                            <Card
                                title="Quản lý màu sắc & Variants"
                                style={{
                                    marginBottom: 24,
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                }}
                                headStyle={{ borderBottom: '2px solid #f0f0f0' }}
                            >
                                <div style={{ marginBottom: 16, padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        Thêm màu sắc mới:
                                    </Text>
                                    <Select
                                        placeholder="Chọn màu để thêm"
                                        onChange={handleAddColor}
                                        value={null}
                                        style={{ width: '100%' }}
                                        size="large"
                                    >
                                        {colors
                                            .filter(color => !colorVariants.some(cv => cv.color_id === color.color_id))
                                            .map(color => (
                                                <Select.Option key={color.color_id} value={color.color_id}>
                                                    <Space>
                                                        <div
                                                            style={{
                                                                width: 20,
                                                                height: 20,
                                                                borderRadius: '50%',
                                                                backgroundColor: color.hex_code,
                                                                border: '1px solid #d9d9d9'
                                                            }}
                                                        />
                                                        {color.name}
                                                    </Space>
                                                </Select.Option>
                                            ))}
                                    </Select>
                                </div>

                                {colorVariants.map(cv => renderVariantsTable(cv.color_id))}
                            </Card>
                        </Col>

                        <Col xs={24} lg={10}>
                            <Card
                                title="Quản lý Hình ảnh"
                                style={{
                                    marginBottom: 24,
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                }}
                                headStyle={{ borderBottom: '2px solid #f0f0f0' }}
                            >
                                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                    Quản lý hình ảnh cho từng màu sắc
                                </Text>

                                {colorVariants.map(cv => renderColorImages(cv.color_id))}
                            </Card>
                        </Col>
                    </Row>

                    <Card style={{
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        background: 'white'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <Text type="secondary">
                                Kiểm tra kỹ thông tin trước khi lưu
                            </Text>
                            <Space size="middle">
                                <Popconfirm
                                    title="Xóa sản phẩm"
                                    description="Bạn chắc chắn muốn xóa vĩnh viễn sản phẩm này? Hành động này không thể hoàn tác."
                                    onConfirm={() => handleHardDelete()}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button
                                        size="large"
                                        danger
                                        icon={<DeleteOutlined />}
                                        disabled={loading}
                                    >
                                        Xóa
                                    </Button>
                                </Popconfirm>
                                <Button
                                    size="large"
                                    onClick={() => navigate('/admin/products')}
                                    disabled={loading}
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="primary"
                                    size="large"
                                    htmlType="submit"
                                    loading={loading}
                                    style={{
                                        background: 'black',
                                        border: 'none',
                                        height: '44px',
                                        padding: '0 32px',
                                        fontWeight: 600
                                    }}
                                >
                                    {loading ? 'Đang lưu...' : 'Cập nhật sản phẩm'}
                                </Button>
                            </Space>
                        </div>
                    </Card>
                </Form>
            </div>
        </div>
    );
}
