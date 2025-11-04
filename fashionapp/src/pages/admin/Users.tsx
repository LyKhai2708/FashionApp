import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Select, Button, Space, Tag, Popconfirm, Statistic, Row, Col } from 'antd';
import { UserOutlined, SearchOutlined, ReloadOutlined, CheckOutlined, StopOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import userService, { type User } from '../../services/userService';

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        loadUsers();
    }, [currentPage, roleFilter, statusFilter]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');
            
            const params: any = {
                page: currentPage,
                limit,
            };
            
            if (roleFilter) params.role = roleFilter;
            if (statusFilter !== '') params.is_active = Number(statusFilter);
            if (searchTerm) params.name = searchTerm;
            
            const data = await userService.getAllUsers(params);
            setUsers(data.users);
            setTotalPages(data.metadata.totalPages);
            setTotal(data.metadata.totalRecords);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        loadUsers();
    };

    const handleResetFilters = () => {
        setRoleFilter('');
        setStatusFilter('');
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleToggleStatus = async (userId: number, currentStatus: number) => {
        if (!window.confirm(`Xác nhận ${currentStatus === 1 ? 'vô hiệu hóa' : 'kích hoạt'} người dùng này?`)) {
            return;
        }

        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            await userService.toggleUserStatus(userId, newStatus);
            await loadUsers();
        } catch (err: any) {
            alert(err.message || 'Không thể cập nhật trạng thái');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns: ColumnsType<User> = [
        {
            title: 'ID',
            dataIndex: 'user_id',
            key: 'user_id',
            width: 80,
            render: (id: number) => <span style={{ fontWeight: 500 }}>#{id}</span>
        },
        {
            title: 'Tên người dùng',
            dataIndex: 'username',
            key: 'username',
            width: 150,
            render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 200
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            width: 120,
            render: (phone: string) => phone || '-'
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            render: (role: string) => (
                <Tag color={role === 'admin' ? 'purple' : 'blue'}>
                    {role === 'admin' ? 'Admin' : 'Customer'}
                </Tag>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 120,
            render: (is_active: number) => (
                <Tag color={is_active === 1 ? 'success' : 'error'}>
                    {is_active === 1 ? 'Hoạt động' : 'Vô hiệu hóa'}
                </Tag>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date: string) => formatDate(date)
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            fixed: 'right',
            render: (_, record) => {
                if (record.role === 'admin') return null;
                return (
                    <Popconfirm
                        title={record.is_active === 1 ? 'Vô hiệu hóa người dùng?' : 'Kích hoạt người dùng?'}
                        description={`Xác nhận ${record.is_active === 1 ? 'vô hiệu hóa' : 'kích hoạt'} người dùng này?`}
                        onConfirm={() => handleToggleStatus(record.user_id, record.is_active || 0)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                        okButtonProps={{ danger: record.is_active === 1 }}
                    >
                        <Button
                            type="link"
                            danger={record.is_active === 1}
                            icon={record.is_active === 1 ? <StopOutlined /> : <CheckOutlined />}
                        >
                            {record.is_active === 1 ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        </Button>
                    </Popconfirm>
                );
            }
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                    <UserOutlined /> Quản lý người dùng
                </h1>
                <div style={{ fontSize: 14, color: '#999' }}>
                    Tổng: <span style={{ fontWeight: 600, color: '#000' }}>{total}</span> người dùng
                </div>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Space size="middle" wrap>
                    <div>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Tìm kiếm</div>
                        <Input
                            placeholder="Tên người dùng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onPressEnter={handleSearch}
                            style={{ width: 200 }}
                            prefix={<SearchOutlined />}
                        />
                    </div>

                    <div>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Vai trò</div>
                        <Select
                            value={roleFilter || undefined}
                            onChange={(value) => setRoleFilter(value || '')}
                            style={{ width: 150 }}
                            placeholder="Tất cả"
                            allowClear
                        >
                            <Select.Option value="customer">Customer</Select.Option>
                            <Select.Option value="admin">Admin</Select.Option>
                        </Select>
                    </div>

                    <div>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Trạng thái</div>
                        <Select
                            value={statusFilter || undefined}
                            onChange={(value) => setStatusFilter(value || '')}
                            style={{ width: 150 }}
                            placeholder="Tất cả"
                            allowClear
                        >
                            <Select.Option value="1">Hoạt động</Select.Option>
                            <Select.Option value="0">Vô hiệu hóa</Select.Option>
                        </Select>
                    </div>

                    <div style={{ paddingTop: 30 }}>
                        <Space>
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleSearch}
                            >
                                Tìm kiếm
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleResetFilters}
                            >
                                Đặt lại
                            </Button>
                        </Space>
                    </div>
                </Space>
            </Card>

            <Card>
                <Table
                    dataSource={users}
                    columns={columns}
                    rowKey="user_id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: limit,
                        total: total,
                        onChange: (page) => setCurrentPage(page),
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} người dùng`
                    }}
                    locale={{
                        emptyText: error ? (
                            <div style={{ padding: '40px 0' }}>
                                <p style={{ color: '#ff4d4f', marginBottom: 16 }}>{error}</p>
                                <Button type="primary" onClick={loadUsers}>Thử lại</Button>
                            </div>
                        ) : 'Không tìm thấy người dùng nào'
                    }}
                    scroll={{ x: 1200 }}
                />
            </Card>
        </div>
    );
};

export default Users;
