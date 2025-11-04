import { useState, useEffect } from 'react';
import { Card, Button, Space, Statistic, Row, Col, Tag, Collapse, Avatar, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, FolderOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useMessage } from '../../App';
import categoryService, { type Category } from '../../services/categoryService';
import CategoryForm from '../../components/admin/CategoryForm';
import { getImageUrl } from '../../utils/imageHelper';

const { Panel } = Collapse;

export default function Categories() {
    const message = useMessage();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    // Form modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0
    });

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAllCategoriesIncludeInactive();
            setCategories(response || []);
            
            const parentIds = (response || [])
                .filter(cat => !cat.parent_id)
                .map(cat => cat.category_id);
            setExpandedCategories(new Set(parentIds));
        } catch (error: any) {
            message.error('Không thể tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const allCategories = await categoryService.getAllCategoriesIncludeInactive();
            setStats({
                total: allCategories.length,
                active: allCategories.filter(cat => cat.active === 1).length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchStats();
    }, []);

    const handleToggleStatus = async (categoryId: number, currentStatus: number) => {
        const action = currentStatus === 1 ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Xác nhận ${action} danh mục này?`)) return;
        
        try {
            await categoryService.toggleCategoryStatus(categoryId);
            message.success(`${action === 'vô hiệu hóa' ? 'Vô hiệu hóa' : 'Kích hoạt'} thành công`);
            fetchCategories();
            fetchStats();
        } catch (error: any) {
            message.error(`Không thể ${action}`);
        }
    };

    const toggleExpand = (categoryId: number) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const handleOpenAddForm = () => {
        setEditingCategory(null);
        setIsFormOpen(true);
    };

    const handleOpenEditForm = (category: Category) => {
        setEditingCategory(category);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingCategory(null);
    };

    const handleSubmitForm = async (formData: FormData) => {
        try {
            if (editingCategory) {
                await categoryService.updateCategory(editingCategory.category_id, formData);
                message.success('Cập nhật danh mục thành công');
            } else {
                await categoryService.createCategory(formData);
                message.success('Thêm danh mục thành công');
            }

            await fetchCategories();
            await fetchStats();
        } catch (error: any) {
            message.error(error.message || 'Không thể thực hiện thao tác');
        }
    };

    const parentCategories = categories.filter(cat => !cat.parent_id);
    const getChildCategories = (parentId: number) => 
        categories.filter(cat => cat.parent_id === parentId);

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                    <FolderOutlined /> Quản lý danh mục
                </h1>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenAddForm}
                    size="large"
                >
                    Thêm danh mục
                </Button>
            </div>

            {/* Stats */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Card>
                        <Statistic
                            title="Tổng danh mục"
                            value={stats.total}
                            prefix={<FolderOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card>
                        <Statistic
                            title="Đang hoạt động"
                            value={stats.active}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Categories Tree */}
            <Card title="Cây danh mục" loading={loading}>
                <Collapse
                    defaultActiveKey={Array.from(expandedCategories)}
                    onChange={(keys) => setExpandedCategories(new Set(keys.map(k => Number(k))))}
                >
                    {parentCategories.map((parent) => {
                        const children = getChildCategories(parent.category_id);

                        return (
                            <Panel
                                key={parent.category_id}
                                header={
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <Space>
                                            <Avatar
                                                src={parent.image_url ? getImageUrl(parent.image_url) : undefined}
                                                style={{ backgroundColor: '#1890ff' }}
                                            >
                                                {!parent.image_url && parent.category_name.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <span style={{ 
                                                textDecoration: parent.active === 0 ? 'line-through' : 'none',
                                                opacity: parent.active === 0 ? 0.5 : 1,
                                                fontWeight: 500
                                            }}>
                                                {parent.category_name}
                                            </span>
                                            {parent.active === 0 && <Tag color="error">Vô hiệu hóa</Tag>}
                                            <Tag color="blue">{children.length} danh mục con</Tag>
                                        </Space>
                                        <Space onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                type="link"
                                                icon={<EditOutlined />}
                                                onClick={() => handleOpenEditForm(parent)}
                                            />
                                            <Popconfirm
                                                title={parent.active === 1 ? 'Vô hiệu hóa danh mục?' : 'Kích hoạt danh mục?'}
                                                onConfirm={() => handleToggleStatus(parent.category_id, parent.active)}
                                                okText="Xác nhận"
                                                cancelText="Hủy"
                                            >
                                                <Button
                                                    type="link"
                                                    danger={parent.active === 1}
                                                    icon={parent.active === 1 ? <DeleteOutlined /> : <CheckOutlined />}
                                                />
                                            </Popconfirm>
                                        </Space>
                                    </div>
                                }
                            >
                                {children.length > 0 && (
                                    <Space direction="vertical" style={{ width: '100%', paddingLeft: 24 }}>
                                        {children.map((child) => (
                                            <Card
                                                key={child.category_id}
                                                size="small"
                                                style={{ marginBottom: 8 }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Space>
                                                        <Avatar
                                                            size="small"
                                                            src={child.image_url ? getImageUrl(child.image_url) : undefined}
                                                            style={{ backgroundColor: '#52c41a' }}
                                                        >
                                                            {!child.image_url && child.category_name.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <div>
                                                            <div style={{ 
                                                                textDecoration: child.active === 0 ? 'line-through' : 'none',
                                                                opacity: child.active === 0 ? 0.5 : 1,
                                                                fontWeight: 500
                                                            }}>
                                                                {child.category_name}
                                                            </div>
                                                            <div style={{ fontSize: 12, color: '#999' }}>ID: {child.category_id}</div>
                                                        </div>
                                                        {child.active === 0 && <Tag color="error" size="small">Vô hiệu hóa</Tag>}
                                                    </Space>
                                                    <Space>
                                                        <Button
                                                            type="link"
                                                            size="small"
                                                            icon={<EditOutlined />}
                                                            onClick={() => handleOpenEditForm(child)}
                                                        />
                                                        <Popconfirm
                                                            title={child.active === 1 ? 'Vô hiệu hóa?' : 'Kích hoạt?'}
                                                            onConfirm={() => handleToggleStatus(child.category_id, child.active)}
                                                            okText="Xác nhận"
                                                            cancelText="Hủy"
                                                        >
                                                            <Button
                                                                type="link"
                                                                size="small"
                                                                danger={child.active === 1}
                                                                icon={child.active === 1 ? <DeleteOutlined /> : <CheckOutlined />}
                                                            />
                                                        </Popconfirm>
                                                    </Space>
                                                </div>
                                            </Card>
                                        ))}
                                    </Space>
                                )}
                            </Panel>
                        );
                    })}
                </Collapse>

                {/* Orphan categories */}
                {categories.filter(cat => cat.parent_id && !categories.find(p => p.category_id === cat.parent_id)).length > 0 && (
                    <Card
                        size="small"
                        style={{ marginTop: 16, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
                        title={<span style={{ color: '#faad14' }}>⚠️ Danh mục mồ côi</span>}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {categories.filter(cat => cat.parent_id && !categories.find(p => p.category_id === cat.parent_id)).map((orphan) => (
                                <div key={orphan.category_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Space>
                                        <Avatar
                                            size="small"
                                            src={orphan.image_url ? getImageUrl(orphan.image_url) : undefined}
                                            style={{ backgroundColor: '#faad14' }}
                                        >
                                            {!orphan.image_url && orphan.category_name.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{orphan.category_name}</div>
                                            <div style={{ fontSize: 12, color: '#faad14' }}>Parent không tồn tại</div>
                                        </div>
                                    </Space>
                                    <Space>
                                        <Button
                                            type="link"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => handleOpenEditForm(orphan)}
                                        />
                                        <Popconfirm
                                            title={orphan.active === 1 ? 'Vô hiệu hóa?' : 'Kích hoạt?'}
                                            onConfirm={() => handleToggleStatus(orphan.category_id, orphan.active)}
                                            okText="Xác nhận"
                                            cancelText="Hủy"
                                        >
                                            <Button
                                                type="link"
                                                size="small"
                                                danger={orphan.active === 1}
                                                icon={orphan.active === 1 ? <DeleteOutlined /> : <CheckOutlined />}
                                            />
                                        </Popconfirm>
                                    </Space>
                                </div>
                            ))}
                        </Space>
                    </Card>
                )}
            </Card>

            <CategoryForm
                category={editingCategory}
                parentCategories={parentCategories}
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={handleSubmitForm}
                isEditing={!!editingCategory}
            />
        </div>
    );
}