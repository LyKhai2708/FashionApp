import React from 'react';

interface PaymentStatusBadgeProps {
    status: string;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Unpaid',
                    className: 'bg-orange-100 text-orange-800'
                };
            case 'paid':
                return {
                    label: 'Paid',
                    className: 'bg-green-100 text-green-800'
                };
            case 'failed':
                return {
                    label: 'Payment Failed',
                    className: 'bg-red-100 text-red-800'
                };
            case 'cancelled':
                return {
                    label: 'Cancelled',
                    className: 'bg-gray-100 text-gray-800'
                };
            case 'refunded':
                return {
                    label: 'Refunded',
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
