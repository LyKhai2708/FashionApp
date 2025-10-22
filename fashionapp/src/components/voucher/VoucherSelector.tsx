import { Modal, Button, Space, Typography } from "antd";
import { GiftOutlined } from '@ant-design/icons';
import { useState } from "react";
import VoucherList from './VoucherList';
import voucherService, { Voucher, VoucherValidationResponse } from '../../services/voucherService';

const { Title } = Typography;

interface VoucherSelectorProps {
    visible: boolean;
    onClose: () => void;
    onVoucherSelected: (voucherData: VoucherValidationResponse) => void;
    orderAmount: number;
    shippingFee?: number;
    loading?: boolean;
}

export default function VoucherSelector({ 
    visible, 
    onClose, 
    onVoucherSelected, 
    orderAmount, 
    shippingFee = 0,
    loading = false
}: VoucherSelectorProps) {
    const [applyingVoucher, setApplyingVoucher] = useState(false);

    const handleVoucherSelect = async (voucher: Voucher) => {
        setApplyingVoucher(true);
        try {
            const result = await voucherService.validateVoucher(
                voucher.code, 
                orderAmount, 
                shippingFee
            );
            onVoucherSelected(result);
            onClose();
        } catch (error: any) {
            console.error('Error applying voucher:', error);
        } finally {
            setApplyingVoucher(false);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <GiftOutlined className="text-blue-500" />
                    <span>Chọn voucher</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Đóng
                </Button>
            ]}
            width={800}
            destroyOnClose
        >
            <Space direction="vertical" className="w-full" size="middle">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <Typography.Text>
                        Chọn voucher để áp dụng cho đơn hàng 
                        <span className="font-medium text-blue-600 ml-1">
                            {orderAmount.toLocaleString('vi-VN')} VNĐ
                        </span>
                        {shippingFee > 0 && (
                            <span>
                                {' '}+ Phí ship: {shippingFee.toLocaleString('vi-VN')} VNĐ
                            </span>
                        )}
                    </Typography.Text>
                </div>

                <VoucherList
                    orderAmount={orderAmount}
                    onVoucherApply={handleVoucherSelect}
                    showApplyButton={true}
                    loading={loading || applyingVoucher}
                />
            </Space>
        </Modal>
    );
}