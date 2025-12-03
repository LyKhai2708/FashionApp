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
            message.error('Không thể tải danh sách thương hiệu');
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
        const action = currentStatus === 1 ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Xác nhận ${action} thương hiệu này?`)) return;

        try {
            await brandService.toggleBrandStatus(brandId);
            message.success(`${action === 'vô hiệu hóa' ? 'Vô hiệu hóa' : 'Kích hoạt'} thành công`);
            fetchBrands();
            fetchStats();
        } catch (error: any) {
            message.error(`Không thể ${action}`);
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
                message.success('Cập nhật thương hiệu thành công');
            } else {
                await brandService.createBrand(data);
                message.success('Thêm thương hiệu thành công');
            }

            await fetchBrands();
            await fetchStats();
            handleCloseModal();
        } catch (error: any) {
            message.error(error.message || 'Không thể thực hiện thao tác');
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
            title: 'Tên thương hiệu',
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
            title: 'Trạng thái',
            dataIndex: 'active',
            key: 'active',
            width: 150,
            render: (active: number) => (
                <AntTag color={active === 1 ? 'success' : 'error'}>
                    {active === 1 ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                </AntTag>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Thao tác',
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
                            Sửa
                        </Button>
                    </PermissionGate>
                    <PermissionGate permission="brands.delete">
                        <Popconfirm
                            title={record.active === 1 ? 'Vô hiệu hóa thương hiệu?' : 'Kích hoạt thương hiệu?'}
                            description={`Xác nhận ${record.active === 1 ? 'vô hiệu hóa' : 'kích hoạt'} thương hiệu này?`}
                            onConfirm={() => handleToggleStatus(record.id, record.active)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                        >
                            <Button
                                type="link"
                                danger={record.active === 1}
                                icon={record.active === 1 ? <DeleteOutlined /> : <CheckOutlined />}
                            >
                                {record.active === 1 ? 'Vô hiệu' : 'Kích hoạt'}
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
                    <TagOutlined /> Quản lý thương hiệu
                </h1>
                <PermissionGate permission="brands.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenAddModal}
                        size="large"
                    >
                        Thêm thương hiệu
                    </Button>
                </PermissionGate>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Card>
                        <Statistic
                            title="Tổng thương hiệu"
                            value={stats.total}
                            prefix={<TagOutlined />}
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

            <Card title="Danh sách thương hiệu">
                <Table
                    dataSource={brands}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} thương hiệu`
                    }}
                    locale={{
                        emptyText: 'Chưa có thương hiệu nào'
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