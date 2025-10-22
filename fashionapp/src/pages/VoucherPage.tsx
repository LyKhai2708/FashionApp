import { useState, useEffect } from "react";
import { Typography, Card, Space, Alert } from "antd";
import { GiftOutlined } from '@ant-design/icons';
import VoucherList from "../components/voucher/VoucherList";
import { useCart } from "../contexts/CartContext";
import { VoucherValidationResponse } from "../services/voucherService";
import Breadcrumb from '../components/Breadcrumb';

const { Title, Text } = Typography;

export default function VoucherPage() {
    const { totalPrice, applyVoucher, appliedVoucher } = useCart();
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherValidationResponse | null>(null);

    const handleVoucherApply = async (voucherData: VoucherValidationResponse) => {
        applyVoucher(voucherData);
        setSelectedVoucher(voucherData);
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <Breadcrumb />
            
            <div className="mb-8">
                <Space direction="vertical" size="middle" className="w-full">
                    <div className="flex items-center gap-3">
                        <GiftOutlined className="text-blue-500 text-2xl" />
                        <Title level={2} className="!mb-0">
                            Voucher Khuyến Mãi
                        </Title>
                    </div>
                    
                    <Text type="secondary">
                        Khám phá các voucher khuyến mãi hấp dẫn và tiết kiệm khi mua sắm!
                    </Text>
                </Space>
            </div>

            {appliedVoucher && (
                <div className="mb-6">
                    <Alert
                        message="Đã áp dụng voucher"
                        description={
                            <div>
                                <Text strong>{appliedVoucher.voucher.code}</Text> - {appliedVoucher.voucher.name}
                                <br />
                                <Text type="success">
                                    Giảm: {appliedVoucher.order_summary.discount_amount.toLocaleString('vi-VN')} VNĐ
                                </Text>
                            </div>
                        }
                        type="success"
                        showIcon
                        className="mb-4"
                    />
                </div>
            )}

            {totalPrice > 0 && (
                <div className="mb-6">
                    <Alert
                        message="Đang hiển thị voucher phù hợp với giỏ hàng của bạn"
                        description={
                            <Text>
                                Giỏ hàng hiện tại: <Text strong>{totalPrice.toLocaleString('vi-VN')} VNĐ</Text>
                            </Text>
                        }
                        type="info"
                        showIcon
                    />
                </div>
            )}

            <VoucherList
                orderAmount={totalPrice || undefined}
                onVoucherApply={handleVoucherApply}
                showApplyButton={true}
            />

            {totalPrice === 0 && (
                <Card className="text-center py-8">
                    <Title level={4} type="secondary">
                        Thêm sản phẩm vào giỏ hàng để xem các voucher khả dụng
                    </Title>
                    <Text type="secondary">
                        Các voucher sẽ được hiển thị dựa trên giá trị đơn hàng của bạn
                    </Text>
                </Card>
            )}
        </div>
    );
}