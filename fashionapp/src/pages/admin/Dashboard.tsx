import React, { useEffect, useState } from 'react';
import { dashboardService,type DashboardStats } from '../../services/admin/dashboardService';
import RevenueCard from '../../components/admin/Revenue/RevenueCard';
import RevenueChart from '../../components/admin/Revenue/RevenueChart';
import StatCard from '../../components/admin/StatCard';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getStats();
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard stats');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-600 text-center py-8">{error}</div>;
    }

    if (!stats) {
        return null;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

            {/* Revenue Stats - 2 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RevenueCard
                    title="Doanh thu hôm nay"
                    amount={stats.revenue.today.revenue}
                    orderCount={stats.revenue.today.orderCount}
                    changePercent={stats.revenue.today.changePercent}
                    period="today"
                    icon={
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📅</span>
                        </div>
                    }
                />
                <RevenueCard
                    title="Doanh thu tháng này"
                    amount={stats.revenue.month.revenue}
                    orderCount={stats.revenue.month.orderCount}
                    changePercent={stats.revenue.month.changePercent}
                    period="month"
                    icon={
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    }
                />
            </div>

            {/* Revenue Chart */}
            <RevenueChart />

            {/* Overview Stats - 4 cards với comparison */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Users - CÓ comparison */}
                <StatCard
                    title="Tổng người dùng"
                    value={stats.overview.users.total}
                    changePercent={stats.overview.users.changePercent}
                    showComparison={true}
                    icon={
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">👤</span>
                        </div>
                    }
                />

                {/* Products - KHÔNG có comparison */}
                <StatCard
                    title="Tổng sản phẩm"
                    value={stats.overview.products.total}
                    showComparison={false}
                    icon={
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">📦</span>
                        </div>
                    }
                />

                {/* Orders - CÓ comparison */}
                <StatCard
                    title="Tổng đơn hàng"
                    value={stats.overview.orders.total}
                    changePercent={stats.overview.orders.changePercent}
                    showComparison={true}
                    icon={
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">🛒</span>
                        </div>
                    }
                />

                {/* Pending Orders - KHÔNG có comparison */}
                <StatCard
                    title="Đơn chờ xử lý"
                    value={stats.overview.pendingOrders}
                    showComparison={false}
                    icon={
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">⏳</span>
                        </div>
                    }
                />
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Mã đơn
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Khách hàng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Số tiền
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Ngày tạo
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats.recentOrders.map((order) => (
                                <tr key={order.order_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{order.order_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.receiver_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(order.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                                            order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {order.order_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.order_date).toLocaleDateString('vi-VN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;