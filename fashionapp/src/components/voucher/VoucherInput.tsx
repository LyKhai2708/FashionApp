import { Input, Button, Space, Modal, Tag, Spin, Empty, Divider } from "antd";
import { GiftOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useState, useEffect } from "react";
import voucherService, { type Voucher, type VoucherValidationResponse } from '../../services/voucherService';
import { useMessage } from "../../App";
import { SHIPPING } from '../../config/constants';

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
    appliedVoucher,
    loading = false
}: VoucherInputProps) {
    const message = useMessage();
    const [voucherCode, setVoucherCode] = useState('');
    const [validating, setValidating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
    const [loadingVouchers, setLoadingVouchers] = useState(false);

    useEffect(() => {
        if (isModalOpen) {
            fetchAvailableVouchers();
        }
    }, [isModalOpen]);

    const fetchAvailableVouchers = async () => {
        setLoadingVouchers(true);
        try {
            const vouchers = await voucherService.getAvailableVouchers();
            setAvailableVouchers(vouchers);
        } catch (error: any) {
            console.error('Error fetching vouchers:', error);
            message.error('Cannot load voucher list');
        } finally {
            setLoadingVouchers(false);
        }
    };

    const handleApplyVoucher = async (code?: string) => {
        const voucherToApply = code || voucherCode.trim();

        if (!voucherToApply) {
            message.error('Please enter voucher code');
            return;
        }

        setValidating(true);
        try {
            const result = await voucherService.validateVoucher(
                voucherToApply.toUpperCase(),
                orderAmount,
                SHIPPING.STANDARD_FEE
            );
            onVoucherApplied(result);
            setVoucherCode('');
            setIsModalOpen(false);
            message.success('Voucher applied successfully!');
        } catch (error: any) {
            message.error(error.message || 'Invalid voucher');
        } finally {
            setValidating(false);
        }
    };

    const handleRemoveVoucher = () => {
        onVoucherRemoved();
        message.info('Voucher removed');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleApplyVoucher();
        }
    };

    const checkVoucherEligible = (voucher: Voucher): { eligible: boolean; reason?: string } => {
        if (orderAmount < voucher.min_order_amount) {
            return {
                eligible: false,
                reason: `Need ${(voucher.min_order_amount - orderAmount).toLocaleString('vi-VN')}₫ more`
            };
        }
        return { eligible: true };
    };

    const getDiscountText = (voucher: Voucher) => {
        switch (voucher.discount_type) {
            case 'percentage':
                return `${voucher.discount_value}% off${voucher.max_discount_amount ? ` (max ${voucher.max_discount_amount.toLocaleString('vi-VN')}₫)` : ''}`;
            case 'fixed_amount':
                return `${voucher.discount_value.toLocaleString('vi-VN')}₫ off`;
            case 'free_shipping':
                return 'Free shipping';
            default:
                return '';
        }
    };

    const getDaysLeft = (endDate: string): number => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const formatDate = (date: string): string => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const eligibleVouchers = availableVouchers.filter(v => checkVoucherEligible(v).eligible);
    const nonEligibleVouchers = availableVouchers.filter(v => !checkVoucherEligible(v).eligible);

    if (appliedVoucher) {
        const isFreeShipping = appliedVoucher.voucher.discount_type === 'free_shipping';

        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <Space direction="vertical" className="w-full" size="small">
                    <div className="flex items-center justify-between">
                        <Space>
                            <CheckOutlined className="text-green-600" />
                            <span className="font-medium text-green-800">
                                Applied: {appliedVoucher.voucher.code}
                            </span>
                        </Space>
                        <Button
                            type="text"
                            size="small"
                            onClick={handleRemoveVoucher}
                            className="text-red-600 hover:bg-red-50"
                        >
                            Remove
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
                            {isFreeShipping ? (
                                <>
                                    <span>Benefit:</span>
                                    <span className="font-medium text-green-600">
                                        Free shipping
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span>Discount:</span>
                                    <span className="font-medium text-red-600">
                                        -{appliedVoucher.order_summary.discount_amount.toLocaleString('vi-VN')}₫
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </Space>
            </div>
        );
    }

    return (
        <>
            <Button
                icon={<GiftOutlined />}
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-4 border-dashed border-2 border-blue-400 text-blue-600 hover:border-blue-500 hover:text-blue-700"
                size="large"
            >
                Select or enter voucher code
            </Button>

            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <GiftOutlined className="text-blue-500" />
                        <span>Select Voucher</span>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={700}
                destroyOnClose
            >
                <Space direction="vertical" className="w-full" size="large">
                    <div>
                        <div className="text-sm font-medium mb-2">Enter voucher code</div>
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                placeholder="Enter voucher code..."
                                value={voucherCode}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^A-Z0-9]/g, '').toUpperCase();
                                    setVoucherCode(value);
                                }}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                                style={{ textTransform: 'uppercase' }}
                                size="large"
                            />
                            <Button
                                type="primary"
                                onClick={() => handleApplyVoucher()}
                                loading={validating}
                                disabled={loading || !voucherCode.trim()}
                                size="large"
                            >
                                Apply
                            </Button>
                        </Space.Compact>
                    </div>

                    <Divider className="my-2" />

                    {/* Danh sách vouchers */}
                    <div>
                        <div className="text-sm font-medium mb-3">
                            Available Vouchers ({availableVouchers.length})
                        </div>

                        {loadingVouchers ? (
                            <div className="flex justify-center py-8">
                                <Spin size="large" />
                            </div>
                        ) : availableVouchers.length === 0 ? (
                            <Empty
                                description="No vouchers available"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ) : (
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                {/* Vouchers đủ điều kiện */}
                                {eligibleVouchers.length > 0 && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-2">Can apply</div>
                                        {eligibleVouchers.map(voucher => {
                                            const daysLeft = getDaysLeft(voucher.end_date);
                                            return (
                                                <div
                                                    key={voucher.voucher_id}
                                                    className="border-2 border-blue-300 bg-blue-50 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer mb-2"
                                                    onClick={() => handleApplyVoucher(voucher.code)}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <Tag color="blue" className="font-mono font-bold text-sm mb-1">
                                                                {voucher.code}
                                                            </Tag>
                                                            <div className="text-sm font-semibold">
                                                                {voucher.name}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleApplyVoucher(voucher.code);
                                                            }}
                                                        >
                                                            Apply
                                                        </Button>
                                                    </div>

                                                    <div className="text-sm text-blue-700 font-medium mb-2">
                                                        {getDiscountText(voucher)}
                                                    </div>

                                                    {voucher.min_order_amount > 0 && (
                                                        <div className="text-xs text-gray-600">
                                                            Min order: {voucher.min_order_amount.toLocaleString('vi-VN')}₫
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                        <ClockCircleOutlined />
                                                        <span>Exp: {formatDate(voucher.end_date)}</span>
                                                        {daysLeft <= 3 && (
                                                            <Tag color="orange" className="text-xs ml-auto">
                                                                {daysLeft} days left
                                                            </Tag>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Vouchers chưa đủ điều kiện */}
                                {nonEligibleVouchers.length > 0 && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-2">Not eligible</div>
                                        {nonEligibleVouchers.map(voucher => {
                                            const { reason } = checkVoucherEligible(voucher);
                                            const daysLeft = getDaysLeft(voucher.end_date);
                                            return (
                                                <div
                                                    key={voucher.voucher_id}
                                                    className="border border-gray-300 bg-gray-50 rounded-lg p-3 opacity-60 mb-2"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <Tag color="default" className="font-mono font-bold text-sm mb-1">
                                                                {voucher.code}
                                                            </Tag>
                                                            <div className="text-sm font-semibold text-gray-700">
                                                                {voucher.name}
                                                            </div>
                                                        </div>
                                                        <Tag color="orange" className="text-xs">
                                                            {reason}
                                                        </Tag>
                                                    </div>

                                                    <div className="text-sm text-gray-600 mb-2">
                                                        {getDiscountText(voucher)}
                                                    </div>

                                                    {voucher.min_order_amount > 0 && (
                                                        <div className="text-xs text-gray-500">
                                                            Min order: {voucher.min_order_amount.toLocaleString('vi-VN')}₫
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                                        <ClockCircleOutlined />
                                                        <span>Exp: {formatDate(voucher.end_date)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Space>
            </Modal>
        </>
    );
}
