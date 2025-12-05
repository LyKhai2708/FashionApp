import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Statistic, Row, Col, Tag as AntTag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, TagOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useMessage } from '../../App';
import brandService, { type Brand } from '../../services/brandService';
import BrandModal from '../../components/admin/BrandModal';
import { PermissionGate } from '../../components/PermissionGate';

export default function Brands() {
    const message = useMessage();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    const [stats, setStats] = useState({
        total: 0,
        active: 0
    });

    const fetchBrands = async () => {
        try {
            const response = await brandService.getAllBrandsIncludeInactive();
            setBrands(response || []);
        } catch (error: any) {
            message.error('Cannot load brands');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const allBrands = await brandService.getAllBrandsIncludeInactive();
            setStats({
                total: allBrands.length,
                active: allBrands.filter(brand => brand.active === 1).length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchBrands();
        fetchStats();
    }, []);

    const handleToggleStatus = async (brandId: number, currentStatus: number) => {
        const action = currentStatus === 1 ? 'disable' : 'enable';
        if (!window.confirm(`Are you sure you want to ${action} this brand?`)) return;

        try {
            await brandService.toggleBrandStatus(brandId);
            message.success(`${action === 'disable' ? 'Disabled' : 'Enabled'} successfully`);
            fetchBrands();
            fetchStats();
        } catch (error: any) {
            message.error(`Cannot ${action}`);
        }
    };

    const handleOpenAddModal = () => {
        setEditingBrand(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (brand: Brand) => {
        setEditingBrand(brand);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
    };

    const handleSubmit = async (data: { name: string; active: number }) => {
        try {
            if (editingBrand) {
                await brandService.updateBrand(editingBrand.id, data);
                message.success('Brand updated successfully');
            } else {
                await brandService.createBrand(data);
                message.success('Brand added successfully');
            }

            await fetchBrands();
            await fetchStats();
            handleCloseModal();
        } catch (error: any) {
            message.error(error.message || 'Cannot perform operation');
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Brand Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: Brand) => (
                <span style={{
                    textDecoration: record.active === 0 ? 'line-through' : 'none',
                    opacity: record.active === 0 ? 0.5 : 1,
                    fontWeight: 500
                }}>
                    {name}
                </span>
            )
        },
        {
            title: 'Status',
            dataIndex: 'active',
            key: 'active',
            width: 150,
            render: (active: number) => (
                <AntTag color={active === 1 ? 'success' : 'error'}>
                    {active === 1 ? 'Active' : 'Disabled'}
                </AntTag>
            )
        },
        {
            title: 'Created Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: Brand) => (
                <Space>
                    <PermissionGate permission="brands.edit">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditModal(record)}
                        >
                            Edit
                        </Button>
                    </PermissionGate>
                    <PermissionGate permission="brands.delete">
                        <Popconfirm
                            title={record.active === 1 ? 'Disable brand?' : 'Enable brand?'}
                            description={`Are you sure you want to ${record.active === 1 ? 'disable' : 'enable'} this brand?`}
                            onConfirm={() => handleToggleStatus(record.id, record.active)}
                            okText="Confirm"
                            cancelText="Cancel"
                        >
                            <Button
                                type="link"
                                danger={record.active === 1}
                                icon={record.active === 1 ? <DeleteOutlined /> : <CheckOutlined />}
                            >
                                {record.active === 1 ? 'Disable' : 'Enable'}
                            </Button>
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
                    <TagOutlined /> Brand Management
                </h1>
                <PermissionGate permission="brands.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenAddModal}
                        size="large"
                    >
                        Add Brand
                    </Button>
                </PermissionGate>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Card>
                        <Statistic
                            title="Total Brands"
                            value={stats.total}
                            prefix={<TagOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card>
                        <Statistic
                            title="Active"
                            value={stats.active}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Brand List">
                <Table
                    dataSource={brands}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showTotal: (total) => `Total ${total} brands`
                    }}
                    locale={{
                        emptyText: 'No brands found'
                    }}
                />
            </Card>

            <BrandModal
                brand={editingBrand}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                isEditing={!!editingBrand}
            />
        </div>
    );
}