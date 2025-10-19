import React from 'react';

interface PaymentStatusBadgeProps {
    status: string;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'unpaid':
                return {
                    label: 'Chưa thanh toán',
                    className: 'bg-orange-100 text-orange-800'
                };
            case 'paid':
                return {
                    label: 'Đã thanh toán',
                    className: 'bg-green-100 text-green-800'
                };
            case 'pending_refund':
                return {
                    label: 'Chờ hoàn tiền',
                    className: 'bg-yellow-100 text-yellow-800'
                };
            case 'refunded':
                return {
                    label: 'Đã hoàn tiền',
                    className: 'bg-purple-100 text-purple-800'
                };
            default:
                return {
                    label: status,
                    className: 'bg-gray-100 text-gray-800'
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
            {config.label}
        </span>
    );
};

export default PaymentStatusBadge;
