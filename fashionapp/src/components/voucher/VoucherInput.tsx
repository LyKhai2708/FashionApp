import { Input, Button, Space, Spin } from "antd";
import { GiftOutlined, CheckOutlined } from '@ant-design/icons';
import { useState } from "react";
import voucherService,  { type VoucherValidationResponse } from '../../services/voucherService';
import { useMessage } from "../../App";
const { TextArea } = Input;

interface VoucherInputProps {
    onVoucherApplied: (voucherData: VoucherValidationResponse) => void;
    onVoucherRemoved: () => void;
    orderAmount: number;
    shippingFee?: number;
    appliedVoucher?: VoucherValidationResponse;
    loading?: boolean;
}

export default function VoucherInput({ 
    onVoucherApplied, 
    onVoucherRemoved, 
    orderAmount, 
    shippingFee = 0,
    appliedVoucher,
    loading = false
}: VoucherInputProps) {
    const message = useMessage();
    const [voucherCode, setVoucherCode] = useState('');
    const [validating, setValidating] = useState(false);

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) {
            message.error('Vui lòng nhập mã voucher');
            return;
        }

        setValidating(true);
        try {
            const result = await voucherService.validateVoucher(
                voucherCode.trim().toUpperCase(), 
                orderAmount, 
                shippingFee
            );
            onVoucherApplied(result);
            setVoucherCode('');
            message.success('Áp dụng voucher thành công!');
        } catch (error: any) {
            message.error(error.message || 'Voucher không hợp lệ');
        } finally {
            setValidating(false);
        }
    };

    const handleRemoveVoucher = () => {
        onVoucherRemoved();
        message.info('Đã xóa voucher');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleApplyVoucher();
        }
    };

    if (appliedVoucher) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <Space direction="vertical" className="w-full" size="small">
                    <div className="flex items-center justify-between">
                        <Space>
                            <CheckOutlined className="text-green-600" />
                            <span className="font-medium text-green-800">
                                Đã áp dụng voucher: {appliedVoucher.voucher.code}
                            </span>
                        </Space>
                        <Button 
                            type="text" 
                            size="small" 
                            onClick={handleRemoveVoucher}
                            className="text-red-600 hover:bg-red-50"
                        >
                            Xóa
                        </Button>
                    </div>
                    
                    <div className="text-sm text-green-700">
                        <div>{appliedVoucher.voucher.name}</div>
                        {appliedVoucher.voucher.description && (
                            <div className="text-xs mt-1">{appliedVoucher.voucher.description}</div>
                        )}
                    </div>
                    
                    <div className="bg-white rounded p-2 border border-green-100">
                        <div className="flex justify-between text-sm">
                            <span>Giảm giá:</span>
                            <span className="font-medium text-red-600">
                                -{appliedVoucher.order_summary.discount_amount.toLocaleString('vi-VN')} VNĐ
                            </span>
                        </div>
                    </div>
                </Space>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <Space direction="vertical" className="w-full" size="small">
                <div className="flex items-center gap-2">
                    <GiftOutlined className="text-blue-500" />
                    <span className="font-medium">Nhập mã voucher</span>
                </div>
                
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        placeholder="Nhập mã voucher..."
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        style={{ textTransform: 'uppercase' }}
                    />
                    <Button
                        type="primary"
                        onClick={handleApplyVoucher}
                        loading={validating}
                        disabled={loading || !voucherCode.trim()}
                    >
                        Áp dụng
                    </Button>
                </Space.Compact>
                
                {orderAmount > 0 && (
                    <div className="text-xs text-gray-500">
                        Áp dụng cho đơn hàng từ {orderAmount.toLocaleString('vi-VN')} VNĐ
                    </div>
                )}
            </Space>
        </div>
    );
}