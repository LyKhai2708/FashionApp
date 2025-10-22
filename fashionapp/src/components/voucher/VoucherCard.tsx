import { Card, Tag, Typography, Button, Space } from "antd";
import { GiftOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { Voucher } from '../../services/voucherService';
import voucherService from '../../services/voucherService';

const { Text, Title } = Typography;

interface VoucherCardProps {
    voucher: Voucher;
    orderAmount?: number;
    onApply?: (voucher: Voucher) => void;
    loading?: boolean;
    disabled?: boolean;
    showApplyButton?: boolean;
}

export default function VoucherCard({ 
    voucher, 
    orderAmount, 
    onApply, 
    loading = false, 
    disabled = false,
    showApplyButton = true
}: VoucherCardProps) {
    const daysLeft = voucherService.getDaysLeft(voucher.end_date);
    const isValid = orderAmount ? voucherService.isVoucherValid(voucher, orderAmount) : { isValid: true };
    
    const getDiscountColor = () => {
        switch (voucher.discount_type) {
            case 'percentage':
                return 'blue';
            case 'fixed_amount':
                return 'green';
            case 'free_shipping':
                return 'orange';
            default:
                return 'default';
        }
    };

    const getStatusColor = () => {
        if (!isValid.isValid) return 'red';
        if (daysLeft <= 3) return 'orange';
        if (voucher.remaining_usage !== null && voucher.remaining_usage <= 10) return 'orange';
        return 'green';
    };

    const getStatusText = () => {
        if (!isValid.isValid) return isValid.reason || 'Không khả dụng';
        if (daysLeft <= 3) return `Còn ${daysLeft} ngày`;
        if (voucher.remaining_usage !== null && voucher.remaining_usage <= 10) {
            return `Còn ${voucher.remaining_usage} lượt`;
        }
        return 'Khả dụng';
    };

    return (
        <Card
            className="hover:shadow-md transition-shadow"
            size="small"
            actions={
                showApplyButton && onApply ? [
                    <Button
                        key="apply"
                        type="primary"
                        onClick={() => onApply(voucher)}
                        loading={loading}
                        disabled={disabled || !isValid.isValid}
                        block
                    >
                        Áp dụng
                    </Button>
                ]
            : undefined
            }
        >
            <Space direction="vertical" className="w-full" size="small">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GiftOutlined className="text-blue-500" />
                        <Text strong className="text-sm uppercase tracking-wide">
                            {voucher.code}
                        </Text>
                    </div>
                    <Tag color={getStatusColor()}>
                        {getStatusText()}
                    </Tag>
                </div>

                {/* Title */}
                <Title level={5} className="!mb-0">
                    {voucher.name}
                </Title>

                {/* Description */}
                {voucher.description && (
                    <Text type="secondary" className="text-sm">
                        {voucher.description}
                    </Text>
                )}

                {/* Discount Info */}
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarOutlined className={getDiscountColor()} />
                            <Text strong>
                                {voucherService.formatDiscountValue(voucher)}
                            </Text>
                        </div>
                        <Tag color={getDiscountColor()}>
                            {voucherService.formatDiscountType(voucher.discount_type)}
                        </Tag>
                    </div>
                    
                    {voucher.min_order_amount > 0 && (
                        <Text type="secondary" className="text-xs mt-1">
                            Đơn hàng tối thiểu: {voucher.min_order_amount.toLocaleString('vi-VN')} VNĐ
                        </Text>
                    )}
                    
                    {voucher.max_discount_amount && (
                        <Text type="secondary" className="text-xs">
                            Giảm tối đa: {voucher.max_discount_amount.toLocaleString('vi-VN')} VNĐ
                        </Text>
                    )}
                </div>

                {/* Usage Info */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <ClockCircleOutlined />
                        <span>
                            {voucherService.formatDate(voucher.start_date)} - {voucherService.formatDate(voucher.end_date)}
                        </span>
                    </div>
                    
                    <div>
                        {voucher.user_limit > 1 && (
                            <span>Dùng tối đa {voucher.user_limit} lần</span>
                        )}
                    </div>
                </div>

                {/* Usage Limits */}
                <div className="flex justify-between text-xs">
                    {voucher.usage_limit && (
                        <Text type="secondary">
                            Đã dùng: {voucher.used_count}/{voucher.usage_limit}
                        </Text>
                    )}
                    
                    {orderAmount && !isValid.isValid && (
                        <Text type="danger" className="text-xs">
                            {isValid.reason}
                        </Text>
                    )}
                </div>
            </Space>
        </Card>
    );
}