import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Statistic, Row, Col, Tag as AntTag, Popconfirm, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useMessage } from '../../App';
import supplierService from '../../services/supplierService';
import type { Supplier } from '../../types/supplier';
import SupplierModal from '../../components/admin/SupplierModal';
import { PermissionGate } from '../../components/PermissionGate';

export default function Suppliers() {
    const message = useMessage();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const fetchSuppliers = async (page = 1, limit = 10, searchTerm = '') => {
        try {
            setLoading(true);
            const response = await supplierService.getSuppliers(page, limit, searchTerm);
            setSuppliers(response.data.suppliers);
            setPagination({
                current: response.data.metadata.page,
                pageSize: response.data.metadata.limit,
                total: response.data.metadata.total
            });
        } catch (error: any) {
            message.error('Cannot load suppliers list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers(pagination.current, pagination.pageSize, search);
    }, []);

    const handleTableChange = (newPagination: any) => {
        fetchSuppliers(newPagination.current, newPagination.pageSize, search);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        fetchSuppliers(1, pagination.pageSize, value);
    };

    const handleDelete = async (id: number) => {
        try {
            await supplierService.deleteSupplier(id);
            message.success('Supplier deleted successfully');
            fetchSuppliers(pagination.current, pagination.pageSize, search);
        } catch (error: any) {
            message.error('Cannot delete supplier');
        }
    };

    const handleOpenAddModal = () => {
        setEditingSupplier(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
    };

    const handleSubmit = async (data: any) => {
        try {
            if (editingSupplier) {
                await supplierService.updateSupplier(editingSupplier.supplier_id, data);
                message.success('Supplier updated successfully');
            } else {
                await supplierService.createSupplier(data);
                message.success('Supplier added successfully');
            }

            fetchSuppliers(pagination.current, pagination.pageSize, search);
            handleCloseModal();
        } catch (error: any) {
            message.error(error.message || 'Cannot perform action');
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'supplier_id',
            key: 'supplier_id',
            width: 80,
        },
        {
            title: 'Supplier Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
        },
        {
            title: 'Contact Person',
            dataIndex: 'contact_name',
            key: 'contact_name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: Supplier) => (
                <Space>
                    <PermissionGate permission="suppliers.edit">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditModal(record)}
                        >
                            Edit
                        </Button>
                    </PermissionGate>
                    <PermissionGate permission="suppliers.delete">
                        <Popconfirm
                            title="Delete supplier?"
                            description="Are you sure you want to delete this supplier?"
                            onConfirm={() => handleDelete(record.supplier_id)}
                            okText="Delete"
                            cancelText="Cancel"
                        >
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                            >
                                Delete
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
                    <TagOutlined /> Supplier Management
                </h1>
                <PermissionGate permission="suppliers.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenAddModal}
                        size="large"
                    >
                        Add Supplier
                    </Button>
                </PermissionGate>
            </div>

            <Card>
                <div style={{ marginBottom: 16 }}>
                    <Input.Search
                        placeholder="Search by name, email, phone..."
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                        allowClear
                    />
                </div>
                <Table
                    dataSource={suppliers}
                    columns={columns}
                    rowKey="supplier_id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} suppliers`
                    }}
                    onChange={handleTableChange}
                    locale={{
                        emptyText: 'No suppliers yet'
                    }}
                />
            </Card>

            <SupplierModal
                supplier={editingSupplier}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                isEditing={!!editingSupplier}
            />
        </div>
    );
}
