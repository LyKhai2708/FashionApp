import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { dashboardService } from '../../../services/admin/dashboardService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

type PeriodType = 7 | 30 | 90;

interface RevenueChartData {
    days: number;
    summary: {
        revenue: number;
        orderCount: number;
        period: string;
        days: number;
        startDate: string;
        endDate: string;
    };
    data: Array<{
        date: string;
        revenue: number;
        order_count: number;
    }>;
}

const RevenueChart: React.FC = () => {
    const [period, setPeriod] = useState<PeriodType>(30);
    const [chartData, setChartData] = useState<RevenueChartData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadChartData();
    }, [period]);

    const loadChartData = async () => {
        try {
            setLoading(true);
            const periodMap: Record<PeriodType, 'week' | 'month' | 'year'> = {
                7: 'week',
                30: 'month',
                90: 'year'
            };
            const data = await dashboardService.getRevenueData(periodMap[period]);
            setChartData(data);
        } catch (error) {
            console.error('Failed to load chart data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        return `Doanh thu: ${formatCurrency(context.parsed.y)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value: any) {
                        return formatCurrency(value);
                    }
                }
            },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    };

    const data = {
        labels: chartData?.data.map(d => formatDate(d.date)) || [],
        datasets: [
            {
                label: 'Doanh thu',
                data: chartData?.data.map(d => d.revenue) || [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }
        ]
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Biểu đồ doanh thu
                    </h2>
                    {chartData && (
                        <p className="text-sm text-gray-500 mt-1">
                            Tổng: {formatCurrency(chartData.summary.revenue)} 
                            {' '}({chartData.summary.orderCount} đơn hàng)
                        </p>
                    )}
                </div>
                
                <div className="flex space-x-2">
                    <button
                        onClick={() => setPeriod(7)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            period === 7
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        7 ngày
                    </button>
                    <button
                        onClick={() => setPeriod(30)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            period === 30
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        30 ngày
                    </button>
                    <button
                        onClick={() => setPeriod(90)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            period === 90
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        90 ngày
                    </button>
                </div>
            </div>

            <div className="h-80">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Đang tải...</div>
                    </div>
                ) : chartData ? (
                    <Line options={chartOptions} data={data} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Không có dữ liệu</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueChart;