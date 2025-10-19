import React from 'react';

interface OrderStatusBadgeProps {
    status: string;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Chờ xử lý',
                    className: 'bg-yellow-100 text-yellow-800'
                };
            case 'processing':
                return {
                    label: 'Đang xử lý',
                    className: 'bg-blue-100 text-blue-800'
                };
            case 'shipped':
                return {
                    label: 'Đang giao',
                    className: 'bg-purple-100 text-purple-800'
                };
            case 'delivered':
                return {
                    label: 'Đã giao',
                    className: 'bg-green-100 text-green-800'
                };
            case 'cancelled':
                return {
                    label: 'Đã hủy',
                    className: 'bg-red-100 text-red-800'
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

export default OrderStatusBadge;
