import React, { useState, useEffect } from 'react';
import { HomeOutlined, UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Địa chỉ giao hàng</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onAddAddress}
                    className="!bg-[#111827] !h-10 !px-4 !rounded-lg"
                >
                    Thêm địa chỉ mới
                </Button>
            </div>

            <div className="flex flex-col gap-6">
                {addresses.map((address) => (
                    <div key={address.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        {/* Top Row: Default Status & Actions */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                {address.is_default ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-md">
                                        <HomeOutlined /> Mặc định
                                    </span>
                                ) : (
                                    <div
                                        className="font-bold text-gray-700 cursor-pointer hover:text-black"
                                        onClick={() => handleSetDefault(address.id)}
                                    >
                                        Đặt làm mặc định
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    icon={<EditOutlined />}
                                    onClick={() => onEditAddress(address)}
                                    className="!border-gray-200 !text-gray-600 hover:!border-gray-400 hover:!text-black"
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
                                        danger
                                        icon={<DeleteOutlined />}
                                        className="!bg-red-50 !border-red-100 !text-red-600 hover:!bg-red-100"
                                    >
                                        Xóa
                                    </Button>
                                </Popconfirm>
                            </div>
                        </div>

                        {/* Middle Section: Receiver Info */}
                        {(address.receiver_name || address.receiver_phone || address.receiver_email) && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="font-medium text-gray-900 mb-3">Thông tin người nhận:</p>
                                <div className="flex flex-col gap-2 text-gray-600">
                                    {address.receiver_name && (
                                        <div className="flex items-center gap-3">
                                            <UserOutlined className="text-gray-400" />
                                            <span>{address.receiver_name}</span>
                                        </div>
                                    )}
                                    {address.receiver_phone && (
                                        <div className="flex items-center gap-3">
                                            <PhoneOutlined className="text-gray-400" />
                                            <span>{address.receiver_phone}</span>
                                        </div>
                                    )}
                                    {address.receiver_email && (
                                        <div className="flex items-center gap-3">
                                            <MailOutlined className="text-gray-400" />
                                            <span>{address.receiver_email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bottom Section: Address */}
                        <div className="flex items-start gap-3 text-gray-600">
                            <HomeOutlined className="text-gray-400 mt-1 text-lg" />
                            <span className="leading-relaxed">
                                {address.detail_address}, {address.ward}, {address.province}
                            </span>
                        </div>
                    </div>
                ))}

                {addresses.length === 0 && !loading && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <HomeOutlined className="text-4xl text-gray-300 mb-3" />
                        <p className="text-gray-500">Chưa có địa chỉ nào được lưu</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddressList;