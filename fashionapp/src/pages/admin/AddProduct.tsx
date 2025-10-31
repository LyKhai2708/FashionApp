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
                antMessage.error('Không thể tải dữ liệu');
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
                antMessage.error('Vui lòng chọn ảnh thumbnail');
                return;
            }

            if (selectedColors.length === 0) {
                antMessage.error('Vui lòng chọn ít nhất 1 màu sắc');
                return;
            }


            const missingImages = colorImages.filter(ci => ci.images.length === 0);
            if (missingImages.length > 0) {
                const colorNames = missingImages
                    .map(ci => colors.find(c => c.color_id === ci.color_id)?.name)
                    .join(', ');
                antMessage.error(`Vui lòng thêm ảnh cho màu: ${colorNames}`);
                return;
            }

            const missingSizes = colorVariants.filter(cv => cv.selected_sizes.length === 0);
            if (missingSizes.length > 0) {
                const colorNames = missingSizes
                    .map(cv => colors.find(c => c.color_id === cv.color_id)?.name)
                    .join(', ');
                antMessage.error(`Vui lòng chọn size cho màu: ${colorNames}`);
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

            antMessage.success('Thêm sản phẩm thành công!');
            navigate('/admin/products');
        } catch (error: any) {
            console.error('Create product error:', error);
            antMessage.error(error.response?.data?.message || 'Không thể thêm sản phẩm');
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
                title: 'Số lượng',
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
                        Chọn size có sẵn:
                    </Text>
                    <Select
                        mode="multiple"
                        placeholder="Chọn size cho màu này"
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
                            Chọn size ở trên để thêm variant
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
                        Quay lại danh sách
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                            <Title level={2} style={{ margin: 0 }}>
                                Thêm sản phẩm mới
                            </Title>
                            <Text type="secondary">Điền thông tin để tạo sản phẩm mới</Text>
                        </div>
                    </div>
                    
                    <Steps
                        current={-1}
                        style={{ marginTop: 32 }}
                        items={[
                            {
                                title: 'Thông tin cơ bản',
                            },
                            {
                                title: 'Hình ảnh & Màu sắc',
                            },
                            {
                                title: 'Quản lý tồn kho',
                            },
                            {
                                title: 'Hoàn tất',
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
                            title="Thông tin cơ bản"
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
                                    <Text strong style={{ fontSize: 15 }}>Ảnh thumbnail</Text>
                                    <Tag color="orange">Bắt buộc</Tag>
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
                                            <div style={{ marginTop: 8 }}>Chọn ảnh</div>
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
                                        Ảnh đại diện hiển thị trên danh sách sản phẩm
                                    </Text>
                                </div>
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
                                <TextArea
                                    rows={4}
                                    placeholder="Nhập mô tả sản phẩm"
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Danh mục"
                                        name="category_id"
                                        rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                                    >
                                        <Select
                                            size="large"
                                            placeholder="Chọn danh mục"
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
                                        label="Thương hiệu"
                                        name="brand_id"
                                        rules={[{ required: true, message: 'Vui lòng chọn thương hiệu' }]}
                                    >
                                        <Select
                                            size="large"
                                            placeholder="Chọn thương hiệu"
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
                                label="Giá sản phẩm (VNĐ)"
                                name="base_price"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập giá' },
                                    { type: 'number', min: 0, message: 'Giá phải lớn hơn 0' }
                                ]}
                                tooltip="Tất cả variant đều có cùng giá này"
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

                        {selectedColors.length > 0 && (
                            <Card 
                                title="Quản lý tồn kho theo màu sắc"
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
                            title="Màu sắc & Hình ảnh"
                            style={{ 
                                marginBottom: 24,
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                            headStyle={{ borderBottom: '2px solid #f0f0f0' }}
                        >
                            <Form.Item label="Chọn màu sắc">
                                <Select
                                    mode="multiple"
                                    size="large"
                                    placeholder="Chọn màu sắc"
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
                                            <Tag color="blue">{ci.images.length} ảnh</Tag>
                                        </div>

                                        {/* Preview ảnh đã có với controls */}
                                        {ci.images.length > 0 && (
                                            <div style={{ marginBottom: 16 }}>
                                                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                                    Ảnh đã chọn:
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
                                                                <Tooltip title={index === ci.primaryIndex ? "Ảnh chính" : "Đặt làm ảnh chính"}>
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

                                        {/* Upload mới */}
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
                                                <div style={{ marginTop: 8 }}>Thêm ảnh</div>
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
                            Kiểm tra kỹ thông tin trước khi lưu
                        </Text>
                        <Space size="middle">
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
                                {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
                            </Button>
                        </Space>
                    </div>
                </Card>
            </Form>
            </div>
        </div>
    );
}
