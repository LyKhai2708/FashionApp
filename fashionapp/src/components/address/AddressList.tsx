import React, { useState, useEffect } from 'react';
import {HomeOutlined, UserOutlined, PhoneOutlined, MailOutlined} from '@ant-design/icons';
import { Card, Button, Typography, Tag, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import addressService from '../../services/addressService';
import type { Address } from '../../services/addressService'
const { Title, Text } = Typography;

interface AddressListProps {
    onAddAddress: () => void;
    onEditAddress: (address: Address) => void;
}

const AddressList: React.FC<AddressListProps> = ({ onAddAddress, onEditAddress }) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const data = await addressService.getUserAddresses();
            setAddresses(data);
        } catch (error: any) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAddresses();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await addressService.deleteAddress(id);
            message.success('Xóa địa chỉ thành công');
            loadAddresses();
        } catch (error: any) {
            message.error(error.message);
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            await addressService.setDefaultAddress(id);
            message.success('Đặt địa chỉ mặc định thành công');
            loadAddresses();
        } catch (error: any) {
            message.error(error.message);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <Title level={4}>Địa chỉ giao hàng</Title>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={onAddAddress}
                    className="!bg-black"
                >
                    Thêm địa chỉ mới
                </Button>
            </div>

            <div className="space-y-4 flex flex-col gap-4">
                {addresses.map((address) => (
                    <Card key={address.id} className="border">
                        <div className="flex justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    {address.is_default ? (
                                        <Tag color="blue"><HomeOutlined /> Mặc định</Tag>
                                    ) : null}
                                </div>
                                {(address.receiver_name || address.receiver_phone || address.receiver_email) && (
                                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                        <Text strong className="text-gray-700 mb-2 block">Thông tin người nhận:</Text>
                                        <div className="space-y-1">
                                            {address.receiver_name && (
                                                <div className="flex items-center gap-2">
                                                    <UserOutlined className="text-gray-500" />
                                                    <Text>{address.receiver_name}</Text>
                                                </div>
                                            )}
                                            {address.receiver_phone && (
                                                <div className="flex items-center gap-2">
                                                    <PhoneOutlined className="text-gray-500" />
                                                    <Text>{address.receiver_phone}</Text>
                                                </div>
                                            )}
                                            {address.receiver_email && (
                                                <div className="flex items-center gap-2">
                                                    <MailOutlined className="text-gray-500" />
                                                    <Text>{address.receiver_email}</Text>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Address */}
                                <div className="flex items-start gap-2">
                                    <HomeOutlined className="text-gray-500 mt-1" />
                                    <Text type="secondary">
                                        {address.detail_address}, {address.ward}, {address.province}
                                    </Text>
                                </div>
                            </div>
                            
                            <Space>
                                {!address.is_default ? (
                                    <Button 
                                        size="small" 
                                        icon={<CheckOutlined />}
                                        onClick={() => handleSetDefault(address.id)}
                                    >
                                        Đặt mặc định
                                    </Button>
                                ) : null}
                                <Button 
                                    size="small" 
                                    icon={<EditOutlined />}
                                    onClick={() => onEditAddress(address)}
                                >
                                    Sửa
                                </Button>
                                <Popconfirm
                                    title="Bạn có chắc muốn xóa địa chỉ này?"
                                    onConfirm={() => handleDelete(address.id)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                >
                                    <Button 
                                        size="small" 
                                        danger 
                                        icon={<DeleteOutlined />}
                                    >
                                        Xóa
                                    </Button>
                                </Popconfirm>
                            </Space>
                        </div>
                    </Card>
                ))}
                
                {addresses.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <Text type="secondary">Chưa có địa chỉ nào</Text>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddressList;