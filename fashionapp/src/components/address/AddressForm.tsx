import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Switch, Typography, message, Select } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import addressService from '../../services/addressService';
import type { Address, CreateAddressPayload } from '../../services/addressService';

const { Title } = Typography;

interface AddressFormProps {
    address?: Address | null;
    onBack: () => void;
    onSuccess: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ address, onBack, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [loadingAddress, setLoadingAddress] = useState(true);
    const [isDefault, setIsDefault] = useState(false);

    // Load provinces
    useEffect(() => {
        fetch('http://provinces.open-api.vn/api/v2/?depth=1')
            .then(res => res.json())
            .then(data => {
                setProvinces(data || []);
                setLoadingAddress(false);
            })
            .catch(error => {
                console.error('Error loading provinces:', error);
                setLoadingAddress(false);
            });
    }, []);

    useEffect(() => {
        async function loadAddress() {
            if (address && provinces.length > 0) {
                const defaultValue = !!address.is_default;
                setIsDefault(defaultValue);

                form.setFieldsValue({
                    province: address.province_code,
                    ward: address.ward_code,
                    detail_address: address.detail_address,
                    receiver_name: address.receiver_name,
                    receiver_phone: address.receiver_phone,
                    receiver_email: address.receiver_email,
                    is_default: defaultValue
                });

                // Load wards for the selected province
                if (address.province_code) {
                    await handleProvinceChange(address.province_code.toString());
                    setTimeout(() => {
                        form.setFieldsValue({
                            ward: address.ward_code,
                            is_default: defaultValue
                        });
                    }, 100);
                }
            }
        }
        loadAddress();
    }, [address, provinces, form]);

    const handleProvinceChange = async (provinceCode: string) => {
        form.setFieldsValue({ ward: undefined });
        setWards([]);

        if (provinceCode) {
            try {
                const res = await fetch(
                    `http://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`
                );
                const data = await res.json();
                setWards(data.wards || []);
            } catch (error) {
                console.error('Error loading wards:', error);
            }
        } else {
            setWards([]);
        }
    };
    const handleSubmit = async (values: any) => {
        const provinceName = provinces.find(p => p.code == values.province)?.name;
        const wardName = wards.find(w => w.code == values.ward)?.name;
        if (!provinceName || !wardName) {
            message.error('Please select complete address');
            return;
        }
        try {
            setLoading(true);

            const payload: CreateAddressPayload = {
                province: provinceName,
                province_code: values.province,
                ward: wardName,
                ward_code: values.ward,
                detail_address: values.detail_address,
                receiver_name: values.receiver_name,
                receiver_phone: values.receiver_phone,
                receiver_email: values.receiver_email,
                ...(address ? {} : { is_default: values.is_default || false })
            };

            if (address) {
                await addressService.updateAddress(address.id, payload);
                message.success('Address updated successfully');
            } else {
                await addressService.createAddress(payload);
                message.success('Address added successfully');
            }

            onSuccess();
        } catch (error: any) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={onBack}
                    type="text"
                />
                <Title level={4} className="!mb-0">
                    {address ? 'Edit Address' : 'Add New Address'}
                </Title>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className="max-w-md"
            >
                <div className="mb-4">
                    <Title level={5} className="!mb-3">Recipient Information</Title>

                    <Form.Item
                        label="Recipient Name"
                        name="receiver_name"
                        rules={[
                            {
                                required: true,
                                message: 'Please enter recipient name'
                            },
                            {
                                min: 2,
                                message: 'Recipient name must be at least 2 characters'
                            },
                            {
                                max: 100,
                                message: 'Recipient name cannot exceed 100 characters'
                            }
                        ]}
                    >
                        <Input placeholder="Enter recipient name" />
                    </Form.Item>

                    <Form.Item
                        label="Recipient Phone Number"
                        name="receiver_phone"
                        rules={[
                            {
                                required: true,
                                pattern: /^(0)[0-9]{9,10}$/,
                                message: 'Invalid phone number (must start with 0, 10-11 digits)'
                            }
                        ]}
                    >
                        <Input placeholder="Enter phone number" />
                    </Form.Item>

                    <Form.Item
                        label="Recipient Email"
                        name="receiver_email"
                        rules={[
                            {
                                required: true,
                                type: 'email',
                                message: 'Invalid email'
                            },
                            {
                                max: 100,
                                message: 'Email cannot exceed 100 characters'
                            }
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>
                </div>
                <Title level={5} className="!mb-3">Address Information</Title>
                <Form.Item
                    label="Province/City"
                    name="province"
                    rules={[{ required: true, message: 'Please select province/city' }]}
                >
                    <Select
                        placeholder="Select province/city"
                        onChange={handleProvinceChange}
                        loading={loadingAddress}
                    >
                        {provinces.map(province => (
                            <Select.Option key={province.code} value={province.code}>
                                {province.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Ward/Commune"
                    name="ward"
                    rules={[{ required: true, message: 'Please select ward/commune' }]}
                >
                    <Select
                        placeholder="Select ward/commune"
                        disabled={wards.length === 0}
                    >
                        {wards.map(ward => (
                            <Select.Option key={ward.code} value={ward.code}>
                                {ward.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Detailed Address"
                    name="detail_address"
                    rules={[
                        { required: true, message: 'Please enter detailed address' },
                        { min: 5, message: 'Address must be at least 5 characters' },
                        { max: 200, message: 'Address cannot exceed 200 characters' }
                    ]}
                >
                    <Input.TextArea
                        rows={3}
                        placeholder="House number, street name..."
                    />
                </Form.Item>


                {!address && (
                    <Form.Item name="is_default" valuePropName="checked" initialValue={false}>
                        <Switch
                            checked={isDefault}
                            onChange={(checked) => {
                                setIsDefault(checked);
                                form.setFieldsValue({ is_default: checked });
                            }}
                        />  <span className="ml-2">Set as default address</span>
                    </Form.Item>
                )}

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        className="!bg-black"
                        block
                    >
                        {address ? 'Update' : 'Add Address'}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default AddressForm;