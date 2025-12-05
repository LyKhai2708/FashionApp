import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Select, Button, Space, Tag, Popconfirm, Modal, Form, message } from 'antd';
import { UserOutlined, SearchOutlined, ReloadOutlined, CheckOutlined, StopOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import userService, { type User } from '../../services/userService';
import roleService, { type Role } from '../../services/roleService';
import { PermissionGate } from '../../components/PermissionGate';

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        loadUsers();
        fetchRoles();
    }, [currentPage, roleFilter, statusFilter]);

    const fetchRoles = async () => {
        try {
            const data = await roleService.getRoles();
            setRoles(data);
        } catch (err: any) {
            console.error('Failed to fetch roles:', err);
            message.error('Cannot load roles');
        }
    };

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
            setTotal(data.metadata.totalRecords);
        } catch (err: any) {
            setError(err.message || 'Cannot load users');
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
        if (!window.confirm(`Are you sure you want to ${currentStatus === 1 ? 'deactivate' : 'activate'} this user?`)) {
            return;
        }

        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            await userService.toggleUserStatus(userId, newStatus);
            await loadUsers();
        } catch (err: any) {
            alert(err.message || 'Cannot update status');
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

    const handleCreateUser = async (values: any) => {
        try {
            setIsCreating(true);
            await userService.createUser(values);
            message.success('User created successfully!');
            setIsModalOpen(false);
            form.resetFields();
            await loadUsers();
        } catch (err: any) {
            message.error(err.message || 'Cannot create user');
        } finally {
            setIsCreating(false);
        }
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
            title: 'Username',
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
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            width: 120,
            render: (phone: string) => phone || '-'
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            render: (roleName: string) => {
                const defaultColors: Record<string, string> = {
                    admin: 'purple',
                    manager: 'blue',
                    staff: 'cyan',
                    customer: 'green'
                };
                const color = defaultColors[roleName] || 'default';

                return (
                    <Tag color={color}>
                        {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
                    </Tag>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 120,
            render: (is_active: number) => (
                <Tag color={is_active === 1 ? 'success' : 'error'}>
                    {is_active === 1 ? 'Active' : 'Disabled'}
                </Tag>
            )
        },
        {
            title: 'Created Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date: string) => formatDate(date)
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            fixed: 'right',
            render: (_, record) => {
                if (record.role === 'admin') return null;
                return (
                    <PermissionGate
                        permission="users.edit"
                        showTooltip={true}
                        tooltipMessage="You don't have permission to edit users"
                        fallback={
                            <Button
                                type="link"
                                disabled
                                icon={record.is_active === 1 ? <StopOutlined /> : <CheckOutlined />}
                                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            >
                                {record.is_active === 1 ? 'Disable' : 'Enable'}
                            </Button>
                        }
                    >
                        <Popconfirm
                            title={record.is_active === 1 ? 'Disable user?' : 'Enable user?'}
                            description={`Are you sure you want to ${record.is_active === 1 ? 'disable' : 'enable'} this user?`}
                            onConfirm={() => handleToggleStatus(record.user_id, record.is_active || 0)}
                            okText="Confirm"
                            cancelText="Cancel"
                            okButtonProps={{ danger: record.is_active === 1 }}
                        >
                            <Button
                                type="link"
                                danger={record.is_active === 1}
                                icon={record.is_active === 1 ? <StopOutlined /> : <CheckOutlined />}
                            >
                                {record.is_active === 1 ? 'Disable' : 'Enable'}
                            </Button>
                        </Popconfirm>
                    </PermissionGate>
                );
            }
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                        <UserOutlined /> User Management
                    </h1>
                    <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
                        Total: <span style={{ fontWeight: 600, color: '#000' }}>{total}</span> users
                    </div>
                </div>
                <PermissionGate permission="users.create">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        size="large"
                    >
                        Create New User
                    </Button>
                </PermissionGate>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Space size="middle" wrap>
                    <div>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Search</div>
                        <Input
                            placeholder="Username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onPressEnter={handleSearch}
                            style={{ width: 200 }}
                            prefix={<SearchOutlined />}
                        />
                    </div>

                    <div>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Role</div>
                        <Select
                            value={roleFilter || undefined}
                            onChange={(value) => setRoleFilter(value || '')}
                            style={{ width: 150 }}
                            placeholder="All"
                            allowClear
                        >
                            {roles.map(role => (
                                <Select.Option key={role.role_id} value={role.role_name}>
                                    {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
                                </Select.Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Status</div>
                        <Select
                            value={statusFilter || undefined}
                            onChange={(value) => setStatusFilter(value || '')}
                            style={{ width: 150 }}
                            placeholder="All"
                            allowClear
                        >
                            <Select.Option value="1">Active</Select.Option>
                            <Select.Option value="0">Disabled</Select.Option>
                        </Select>
                    </div>

                    <div style={{ paddingTop: 30 }}>
                        <Space>
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleSearch}
                            >
                                Search
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleResetFilters}
                            >
                                Reset
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
                        showTotal: (total) => `Total ${total} users`
                    }}
                    locale={{
                        emptyText: error ? (
                            <div style={{ padding: '40px 0' }}>
                                <p style={{ color: '#ff4d4f', marginBottom: 16 }}>{error}</p>
                                <Button type="primary" onClick={loadUsers}>Retry</Button>
                            </div>
                        ) : 'No users found'
                    }}
                    scroll={{ x: 1200 }}
                />
            </Card>

            <Modal
                title="Create New User"
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateUser}
                    style={{ marginTop: 24 }}
                >
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[
                            { required: true, message: 'Please enter username' },
                            { min: 3, message: 'Username must be at least 3 characters' }
                        ]}
                    >
                        <Input placeholder="Enter username" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Invalid email' }
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            { required: true, message: 'Please enter password' },
                            { min: 8, message: 'Password must be at least 8 characters' }
                        ]}
                    >
                        <Input.Password placeholder="Enter password" />
                    </Form.Item>

                    <Form.Item
                        label="Phone Number (optional)"
                        name="phone"
                        rules={[
                            { pattern: /^[0-9]{10}$/, message: 'Phone number must be 10 digits' }
                        ]}
                    >
                        <Input placeholder="Enter phone number" />
                    </Form.Item>

                    <Form.Item
                        label="Role"
                        name="role_id"
                        initialValue={2}
                        rules={[{ required: true, message: 'Please select a role' }]}
                    >
                        <Select placeholder="Select role">
                            {roles.map(role => (
                                <Select.Option key={role.role_id} value={role.role_id}>
                                    {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => {
                                setIsModalOpen(false);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isCreating}
                            >
                                Create User
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Users;
