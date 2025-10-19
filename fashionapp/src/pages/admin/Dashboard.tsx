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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            <RevenueChart />

            

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold">🏆 Sản phẩm bán chạy tháng này</h2>
                    </div>
                    <div className="p-6">
                        {stats.topProducts.length > 0 ? (
                            <div className="space-y-4">
                                {stats.topProducts.map((product, index) => (
                                    <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{product.product_name}</p>
                                                <p className="text-sm text-gray-500">Đã bán: {product.total_sold} sản phẩm</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-green-600">
                                                {new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND',
                                                    notation: 'compact'
                                                }).format(product.total_revenue)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold">⚠️ Sản phẩm sắp hết hàng (dưới 10 sản phẩm)</h2>
                    </div>
                    <div className="p-6">
                        {stats.lowStockProducts.length > 0 ? (
                            <div className="space-y-3">
                                {stats.lowStockProducts.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.product_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.size_name} - {item.color_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                item.stock_quantity === 0 ? 'bg-red-100 text-red-700' :
                                                item.stock_quantity < 5 ? 'bg-orange-100 text-orange-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {item.stock_quantity} còn lại
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">Tất cả sản phẩm đều đủ hàng</p>
                        )}
                    </div>
                </div>
            </div>


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