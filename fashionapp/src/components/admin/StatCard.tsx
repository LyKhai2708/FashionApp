import React from 'react';

interface StatCardProps {
    title: string;
    value: number;
    icon?: React.ReactNode;
    changePercent?: number; 
    showComparison?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    changePercent,
    showComparison = false
}) => {
    const isPositive = changePercent !== undefined && changePercent >= 0;
    const formattedValue = new Intl.NumberFormat('vi-VN').format(value);

    return (
        <div className="bg-white rounded-lg shadow p-6 relative">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                        {formattedValue}
                    </p>
                </div>
                {icon && (
                    <div className="ml-4">
                        {icon}
                    </div>
                )}
            </div>

            {showComparison && changePercent !== undefined && (
                <div className="absolute bottom-4 right-4">
                    <div className={`flex items-center space-x-1 text-sm font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                        <span>{isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(changePercent).toFixed(2)}%</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatCard;