import React from 'react';

interface RevenueCardProps {
    title: string;
    amount: number;
    orderCount: number;
    changePercent: number;
    period: string;
    icon?: React.ReactNode;
}

const RevenueCard: React.FC<RevenueCardProps> = ({
    title,
    amount,
    orderCount,
    changePercent,
    period,
    icon
}) => {
    const isPositive = changePercent >= 0;
    const formattedAmount = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                        {formattedAmount}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                        <span className="text-sm text-gray-500">
                            {orderCount} orders
                        </span>
                        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {isPositive ? '↑' : '↓'} {Math.abs(changePercent)}%
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Compared to {period === 'today' ? 'yesterday' : period === 'week' ? 'last week' : 'last month'}
                    </p>
                </div>
                {icon && (
                    <div className="ml-4">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueCard;