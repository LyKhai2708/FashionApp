import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Form,
    Input,
    InputNumber,
    Select,
    Button,
    Upload,
    Card,
    Space,
    Divider,
    Row,
    Col,
    Typography,
    Tag,
    message as antMessage,
    Spin,
    Table,
    Steps,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    ArrowLeftOutlined,
    DeleteOutlined,
    StarOutlined,
    StarFilled
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import brandService from '../../services/brandService';
import categoryService, { type Category } from '../../services/categoryService';
import colorService from '../../services/colorService';
import sizeService from '../../services/sizeService';
import api from '../../utils/axios';

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
}

interface ColorImage {
    color_id: number;
    images: UploadFile[];
    primaryIndex: number;  // Index của ảnh primary (default: 0)
}

interface ColorVariants {
    color_id: number;
    selected_sizes: number[];
    variants: Variant[];
}

export default function AddProduct() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);


    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [colors, setColors] = useState<Color[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);


    const [thumbnailFile, setThumbnailFile] = useState<UploadFile[]>([]);
    const [colorImages, setColorImages] = useState<ColorImage[]>([]);
    const [colorVariants, setColorVariants] = useState<ColorVariants[]>([]);
    const [selectedColors, setSelectedColors] = useState<number[]>([]);


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
            } catch (error) {
                antMessage.error('Cannot load data');
            } finally {
                setPageLoading(false);
            }
        };

        loadData();
    }, []);


    const handleColorChange = (colorIds: number[]) => {
        setSelectedColors(colorIds);


        const newColorImages = colorIds.map(colorId => {
            const existing = colorImages.find(ci => ci.color_id === colorId);
            return existing || { color_id: colorId, images: [], primaryIndex: 0 };
        });
        setColorImages(newColorImages);

        // Initialize color variants
        const newColorVariants = colorIds.map(colorId => {
            const existing = colorVariants.find(cv => cv.color_id === colorId);
            return existing || {
                color_id: colorId,
                selected_sizes: [],
                variants: []
            };
        });
        setColorVariants(newColorVariants);
    };

    const handleColorSizeChange = (colorId: number, sizeIds: number[]) => {
        setColorVariants(prev =>
            prev.map(cv => {
                if (cv.color_id !== colorId) return cv;

                const newVariants = sizeIds.map(sizeId => {
                    const existing = cv.variants.find(v => v.size_id === sizeId);
                    return existing || {
                        color_id: colorId,
                        size_id: sizeId,
                        stock_quantity: 0
                    };
                });

                return {
                    ...cv,
                    selected_sizes: sizeIds,
                    variants: newVariants
                };
            })
        );
    };

    const handleThumbnailChange: UploadProps['onChange'] = ({ fileList }) => {
        setThumbnailFile(fileList.slice(-1)); // Only keep last file
    };

    const handleColorImageChange = (colorId: number, fileList: UploadFile[]) => {
        setColorImages(prev =>
            prev.map(ci => {
                if (ci.color_id !== colorId) return ci;
                // Reset primaryIndex if it's out of bounds
                const newPrimaryIndex = fileList.length > 0 ? Math.min(ci.primaryIndex, fileList.length - 1) : 0;
                return { ...ci, images: fileList, primaryIndex: newPrimaryIndex };
            })
        );
    };

    const handleSetPrimaryImage = (colorId: number, index: number) => {
        setColorImages(prev =>
            prev.map(ci =>
                ci.color_id === colorId ? { ...ci, primaryIndex: index } : ci
            )
        );
    };

    const handleMoveImage = (colorId: number, fromIndex: number, toIndex: number) => {
        setColorImages(prev =>
            prev.map(ci => {
                if (ci.color_id !== colorId) return ci;

                const newImages = [...ci.images];
                const [moved] = newImages.splice(fromIndex, 1);
                newImages.splice(toIndex, 0, moved);

                // Adjust primaryIndex if needed
                let newPrimaryIndex = ci.primaryIndex;
                if (fromIndex === ci.primaryIndex) {
                    newPrimaryIndex = toIndex;
                } else if (fromIndex < ci.primaryIndex && toIndex >= ci.primaryIndex) {
                    newPrimaryIndex--;
                } else if (fromIndex > ci.primaryIndex && toIndex <= ci.primaryIndex) {
                    newPrimaryIndex++;
                }

                return { ...ci, images: newImages, primaryIndex: newPrimaryIndex };
            })
        );
    };

    const handleRemoveImage = (colorId: number, index: number) => {
        setColorImages(prev =>
            prev.map(ci => {
                if (ci.color_id !== colorId) return ci;

                const newImages = ci.images.filter((_, i) => i !== index);
                let newPrimaryIndex = ci.primaryIndex;

                if (index === ci.primaryIndex) {
                    // If removing primary, set to 0 (or keep 0 if no images left)
                    newPrimaryIndex = 0;
                } else if (index < ci.primaryIndex) {
                    // If removing before primary, adjust index
                    newPrimaryIndex--;
                }

                return { ...ci, images: newImages, primaryIndex: newPrimaryIndex };
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


    const handleSubmit = async (values: any) => {
        try {

            if (!thumbnailFile.length) {
                antMessage.error('Please select a thumbnail image');
                return;
            }

            if (selectedColors.length === 0) {
                antMessage.error('Please select at least 1 color');
                return;
            }


            const missingImages = colorImages.filter(ci => ci.images.length === 0);
            if (missingImages.length > 0) {
                const colorNames = missingImages
                    .map(ci => colors.find(c => c.color_id === ci.color_id)?.name)
                    .join(', ');
                antMessage.error(`Please add images for color: ${colorNames}`);
                return;
            }

            const missingSizes = colorVariants.filter(cv => cv.selected_sizes.length === 0);
            if (missingSizes.length > 0) {
                const colorNames = missingSizes
                    .map(cv => colors.find(c => c.color_id === cv.color_id)?.name)
                    .join(', ');
                antMessage.error(`Please select sizes for color: ${colorNames}`);
                return;
            }

            setLoading(true);


            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('description', values.description || '');
            formData.append('base_price', values.base_price.toString());
            formData.append('category_id', values.category_id.toString());
            formData.append('brand_id', values.brand_id.toString());


            if (thumbnailFile[0]?.originFileObj) {
                formData.append('images', thumbnailFile[0].originFileObj);
            }


            // Chuẩn bị dữ liệu ảnh với metadata
            const imageMetadata: Array<{
                color_id: number;
                is_primary: boolean;
                display_order: number;
            }> = [];

            colorImages.forEach(ci => {
                ci.images.forEach((img, index) => {
                    if (img.originFileObj) {
                        formData.append('images', img.originFileObj);
                        formData.append('image_colors', ci.color_id.toString());

                        // Metadata cho từng ảnh
                        imageMetadata.push({
                            color_id: ci.color_id,
                            is_primary: index === ci.primaryIndex,
                            display_order: index + 1
                        });
                    }
                });
            });

            // Gửi metadata
            formData.append('image_metadata', JSON.stringify(imageMetadata));

            const allVariants = colorVariants.flatMap(cv => cv.variants);
            formData.append('variants', JSON.stringify(allVariants));

            await api.post('/api/v1/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            antMessage.success('Product added successfully!');
            navigate('/admin/products');
        } catch (error: any) {
            console.error('Create product error:', error);
            antMessage.error(error.response?.data?.message || 'Cannot add product');
        } finally {
            setLoading(false);
        }
    };

    const renderVariantsTable = (colorId: number) => {
        const color = colors.find(c => c.color_id === colorId);
        const cv = colorVariants.find(cv => cv.color_id === colorId);

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
                title: 'Quantity',
                dataIndex: 'stock_quantity',
                key: 'stock_quantity',
                render: (_: any, record: Variant) => (
                    <InputNumber
                        min={0}
                        value={record.stock_quantity}
                        onChange={(value) => handleStockChange(colorId, record.size_id, value)}
                        style={{ width: '100%' }}
                    />
                )
            }
        ];

        return (
            <Card
                key={colorId}
                size="small"
                title={
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
                        {cv && cv.variants.length > 0 && (
                            <Tag color="green">{cv.variants.length} variants</Tag>
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
                <div style={{
                    marginBottom: 16,
                    padding: '12px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #f0f0f0'
                }}>
                    <Text strong style={{ display: 'block', marginBottom: 8, color: '#595959' }}>
                        Select available sizes:
                    </Text>
                    <Select
                        mode="multiple"
                        placeholder="Select sizes for this color"
                        value={cv?.selected_sizes || []}
                        onChange={(sizeIds) => handleColorSizeChange(colorId, sizeIds)}
                        style={{ width: '100%' }}
                        size="large"
                    >
                        {sizes.map(size => (
                            <Select.Option key={size.size_id} value={size.size_id}>
                                <Tag color="blue">{size.name}</Tag>
                            </Select.Option>
                        ))}
                    </Select>
                </div>

                {cv && cv.variants.length > 0 ? (
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
                            Select sizes above to add variants
                        </Text>
                    </div>
                )}
            </Card>
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
                        Back to list
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                            <Title level={2} style={{ margin: 0 }}>
                                Add New Product
                            </Title>
                            <Text type="secondary">Fill in the information to create a new product</Text>
                        </div>
                    </div>

                    <Steps
                        current={-1}
                        style={{ marginTop: 32 }}
                        items={[
                            {
                                title: 'Basic Information',
                            },
                            {
                                title: 'Images & Colors',
                            },
                            {
                                title: 'Size',
                            },
                            {
                                title: 'Complete',
                            }
                        ]}
                    />
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        base_price: 0
                    }}
                >
                    <Row gutter={24}>

                        <Col xs={24} lg={14}>
                            <Card
                                title="Basic Information"
                                style={{
                                    marginBottom: 24,
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                }}
                                headStyle={{ borderBottom: '2px solid #f0f0f0' }}
                            >

                                <div style={{ marginBottom: 24 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: 12
                                    }}>
                                        <Text strong style={{ fontSize: 15 }}>Thumbnail</Text>
                                        <Tag color="orange">Required</Tag>
                                    </div>
                                    <Upload
                                        listType="picture-card"
                                        fileList={thumbnailFile}
                                        onChange={handleThumbnailChange}
                                        beforeUpload={() => false}
                                        maxCount={1}
                                    >
                                        {thumbnailFile.length === 0 && (
                                            <div>
                                                <PlusOutlined />
                                                <div style={{ marginTop: 8 }}>Select image</div>
                                            </div>
                                        )}
                                    </Upload>
                                    <div style={{
                                        marginTop: 12,
                                        padding: '12px',
                                        background: '#fff7e6',
                                        borderRadius: '8px',
                                        border: '1px solid #ffd591'
                                    }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Representative image displayed on product list
                                        </Text>
                                    </div>
                                </div>

                                <Divider />

                                <Form.Item
                                    label="Product Name"
                                    name="name"
                                    rules={[
                                        { required: true, message: 'Please enter product name' },
                                        { min: 3, message: 'Product name must have at least 3 characters' },
                                        { max: 100, message: 'Product name cannot exceed 100 characters' }
                                    ]}
                                >
                                    <Input size="large" placeholder="Enter product name" />
                                </Form.Item>

                                <Form.Item
                                    label="Description"
                                    name="description"
                                    rules={[{ max: 500, message: 'Description cannot exceed 500 characters' }]}
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Enter product description"
                                    />
                                </Form.Item>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Category"
                                            name="category_id"
                                            rules={[{ required: true, message: 'Please select a category' }]}
                                        >
                                            <Select
                                                size="large"
                                                placeholder="Select category"
                                                showSearch
                                                optionFilterProp="children"
                                            >
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
                                            label="Brand"
                                            name="brand_id"
                                            rules={[{ required: true, message: 'Please select a brand' }]}
                                        >
                                            <Select
                                                size="large"
                                                placeholder="Select brand"
                                                showSearch
                                                optionFilterProp="children"
                                            >
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
                                    label="Product Price (VND)"
                                    name="base_price"
                                    rules={[
                                        { required: true, message: 'Please enter price' },
                                        { type: 'number', min: 0, message: 'Price must be greater than 0' }
                                    ]}
                                    tooltip="All variants have the same price"
                                >
                                    <InputNumber
                                        size="large"
                                        style={{ width: '100%' }}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                                        placeholder="Enter product price"
                                    />
                                </Form.Item>
                            </Card>

                            {selectedColors.length > 0 && (
                                <Card
                                    title="Inventory Management by Color"
                                    style={{
                                        marginBottom: 24,
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                    }}
                                    headStyle={{ borderBottom: '2px solid #f0f0f0' }}
                                >
                                    {selectedColors.map(colorId => renderVariantsTable(colorId))}
                                </Card>
                            )}
                        </Col>

                        <Col xs={24} lg={10}>
                            <Card
                                title="Colors & Images"
                                style={{
                                    marginBottom: 24,
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                }}
                                headStyle={{ borderBottom: '2px solid #f0f0f0' }}
                            >
                                <Form.Item label="Select Colors">
                                    <Select
                                        mode="multiple"
                                        size="large"
                                        placeholder="Select colors"
                                        value={selectedColors}
                                        onChange={handleColorChange}
                                        optionLabelProp="label"
                                    >
                                        {colors.map(color => (
                                            <Select.Option
                                                key={color.color_id}
                                                value={color.color_id}
                                                label={
                                                    <Space>
                                                        <div
                                                            style={{
                                                                width: 16,
                                                                height: 16,
                                                                borderRadius: '50%',
                                                                backgroundColor: color.hex_code,
                                                                border: '1px solid #d9d9d9'
                                                            }}
                                                        />
                                                        {color.name}
                                                    </Space>
                                                }
                                            >
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
                                </Form.Item>

                                <Divider />

                                {colorImages.map(ci => {
                                    const color = colors.find(c => c.color_id === ci.color_id);
                                    return (
                                        <div key={ci.color_id} style={{
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
                                                <Tag color="blue">{ci.images.length} images</Tag>
                                            </div>

                                            {/* Preview ảnh đã có với controls */}
                                            {ci.images.length > 0 && (
                                                <div style={{ marginBottom: 16 }}>
                                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                                        Selected images:
                                                    </Text>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {ci.images.map((img, index) => (
                                                            <div
                                                                key={img.uid}
                                                                style={{
                                                                    position: 'relative',
                                                                    width: 104,
                                                                    height: 104,
                                                                    border: index === ci.primaryIndex ? '3px solid #1890ff' : '1px solid #d9d9d9',
                                                                    borderRadius: '8px',
                                                                    overflow: 'hidden'
                                                                }}
                                                            >
                                                                <img
                                                                    src={img.thumbUrl || URL.createObjectURL(img.originFileObj as Blob)}
                                                                    alt=""
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: 4,
                                                                    right: 4,
                                                                    display: 'flex',
                                                                    gap: '4px'
                                                                }}>
                                                                    <Tooltip title={index === ci.primaryIndex ? "Primary image" : "Set as primary image"}>
                                                                        <Button
                                                                            size="small"
                                                                            type={index === ci.primaryIndex ? "primary" : "default"}
                                                                            icon={index === ci.primaryIndex ? <StarFilled /> : <StarOutlined />}
                                                                            onClick={() => handleSetPrimaryImage(ci.color_id, index)}
                                                                        />
                                                                    </Tooltip>
                                                                    <Button
                                                                        size="small"
                                                                        danger
                                                                        icon={<DeleteOutlined />}
                                                                        onClick={() => handleRemoveImage(ci.color_id, index)}
                                                                    />
                                                                </div>
                                                                {index > 0 && (
                                                                    <Button
                                                                        size="small"
                                                                        style={{ position: 'absolute', bottom: 4, left: 4 }}
                                                                        onClick={() => handleMoveImage(ci.color_id, index, index - 1)}
                                                                    >
                                                                        ←
                                                                    </Button>
                                                                )}
                                                                {index < ci.images.length - 1 && (
                                                                    <Button
                                                                        size="small"
                                                                        style={{ position: 'absolute', bottom: 4, right: 4 }}
                                                                        onClick={() => handleMoveImage(ci.color_id, index, index + 1)}
                                                                    >
                                                                        →
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <Upload
                                                listType="picture-card"
                                                fileList={[]}
                                                onChange={({ fileList }) => {
                                                    // Append to existing images
                                                    const newImages = [...ci.images, ...fileList];
                                                    handleColorImageChange(ci.color_id, newImages);
                                                }}
                                                beforeUpload={() => false}
                                                multiple
                                                showUploadList={false}
                                            >
                                                <div>
                                                    <PlusOutlined />
                                                    <div style={{ marginTop: 8 }}>Add images</div>
                                                </div>
                                            </Upload>
                                        </div>
                                    );
                                })}
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
                                Please review carefully before saving
                            </Text>
                            <Space size="middle">
                                <Button
                                    size="large"
                                    onClick={() => navigate('/admin/products')}
                                    disabled={loading}
                                >
                                    Cancel
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
                                    {loading ? 'Saving...' : 'Save Product'}
                                </Button>
                            </Space>
                        </div>
                    </Card>
                </Form>
            </div>
        </div>
    );
}
