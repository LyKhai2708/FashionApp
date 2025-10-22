import { useState, useEffect } from "react";
import { Empty, Spin, Button, Space, Card, Typography } from "antd";
import { GiftOutlined, ReloadOutlined } from '@ant-design/icons';
import VoucherCard from './VoucherCard';
import voucherService, { Voucher, VoucherValidationResponse } from '../../services/voucherService';

const { Title, Text } = Typography;

interface VoucherListProps {
    orderAmount?: number;
    onVoucherApply?: (voucher: Voucher) => void;
    showApplyButton?: boolean;
    loading?: boolean;
}

export default function VoucherList({ 
    orderAmount, 
    onVoucherApply, 
    showApplyButton = true,
    loading = false
}: VoucherListProps) {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loadingVouchers, setLoadingVouchers] = useState(false);
    const [applyingVoucher, setApplyingVoucher] = useState<number | null>(null);

    const fetchVouchers = async () => {
        setLoadingVouchers(true);
        try {
            const data = await voucherService.getAvailableVouchers(orderAmount);
            setVouchers(data);
        } catch (error: any) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoadingVouchers(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, [orderAmount]);

    const handleApplyVoucher = async (voucher: Voucher) => {
        if (!orderAmount || !onVoucherApply) return;
        
        setApplyingVoucher(voucher.voucher_id);
        try {
            const result = await voucherService.validateVoucher(
                voucher.code, 
                orderAmount
            );
            onVoucherApply(voucher);
        } catch (error: any) {
            console.error('Error applying voucher:', error);
        } finally {
            setApplyingVoucher(null);
        }
    };

    if (loadingVouchers) {
        return (
            <div className="flex justify-center py-8">
                <Spin size="large" />
            </div>
        );
    }

    if (vouchers.length === 0) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                    <div className="text-center">
                        <Text type="secondary">
                            {orderAmount 
                                ? `Không có voucher nào khả dụng cho đơn hàng ${orderAmount.toLocaleString('vi-VN')} VNĐ`
                                : 'Không có voucher nào khả dụng'
                            }
                        </Text>
                    </div>
                }
            >
                <Button 
                    type="primary" 
                    icon={<ReloadOutlined />}
                    onClick={fetchVouchers}
                    loading={loadingVouchers}
                >
                    Tải lại
                </Button>
            </Empty>
        );
    }

    // Sort vouchers: valid ones first, then by discount value
    const sortedVouchers = [...vouchers].sort((a, b) => {
        const aValid = orderAmount ? voucherService.isVoucherValid(a, orderAmount) : { isValid: true };
        const bValid = orderAmount ? voucherService.isVoucherValid(b, orderAmount) : { isValid: true };
        
        if (aValid.isValid !== bValid.isValid) {
            return aValid.isValid ? -1 : 1;
        }
        
        // Sort by discount value (descending)
        if (a.discount_type === 'percentage' && b.discount_type === 'percentage') {
            return b.discount_value - a.discount_value;
        }
        if (a.discount_type === 'fixed_amount' && b.discount_type === 'fixed_amount') {
            return b.discount_value - a.discount_value;
        }
        
        // Put free shipping last
        if (a.discount_type === 'free_shipping') return 1;
        if (b.discount_type === 'free_shipping') return -1;
        
        return 0;
    });

    return (
        <Space direction="vertical" className="w-full" size="large">
            <div className="flex items-center justify-between">
                <Space>
                    <GiftOutlined className="text-blue-500" />
                    <Title level={4} className="!mb-0">
                        Voucher có sẵn
                    </Title>
                </Space>
                <Button 
                    type="text" 
                    size="small" 
                    icon={<ReloadOutlined />}
                    onClick={fetchVouchers}
                    loading={loadingVouchers}
                >
                    Tải lại
                </Button>
            </div>

            {orderAmount && (
                <Card size="small" className="bg-blue-50 border-blue-200">
                    <Text type="secondary" className="text-sm">
                        Đang hiển thị các voucher có thể áp dụng cho đơn hàng 
                        <span className="font-medium text-blue-600 ml-1">
                            {orderAmount.toLocaleString('vi-VN')} VNĐ
                        </span>
                    </Text>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedVouchers.map((voucher) => (
                    <VoucherCard
                        key={voucher.voucher_id}
                        voucher={voucher}
                        orderAmount={orderAmount}
                        onApply={showApplyButton ? handleApplyVoucher : undefined}
                        loading={applyingVoucher === voucher.voucher_id}
                        disabled={loading}
                        showApplyButton={showApplyButton}
                    />
                ))}
            </div>
        </Space>
    );
}