import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService, { type Order } from '../../services/orderService';
import OrderStatusBadge from '../../components/admin/OrderStatusBadge';
import PaymentStatusBadge from '../../components/admin/PaymentStatusBadge';

const Orders: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        loadOrders();
    }, [currentPage, orderStatus, paymentStatus, paymentMethod]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError('');
            
            const params: any = {
                page: currentPage,
                limit: limit
            };
            
            if (orderStatus) params.order_status = orderStatus;
            if (paymentStatus) params.payment_status = paymentStatus;
            if (paymentMethod) params.payment_method = paymentMethod;

            const result = await orderService.getAllOrders(params);
            setOrders(result.orders);
            setTotalPages(result.pagination.total_pages);
            setTotal(result.pagination.total);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleResetFilters = () => {
        setOrderStatus('');
        setPaymentStatus('');
        setPaymentMethod('');
        setCurrentPage(1);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
                <div className="text-sm text-gray-500">
                    Tổng: <span className="font-semibold">{total}</span> đơn hàng
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái đơn hàng
                        </label>
                        <select
                            value={orderStatus}
                            onChange={(e) => {
                                setOrderStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả</option>
                            <option value="pending">Chờ xử lý</option>
                            <option value="processing">Đang xử lý</option>
                            <option value="shipped">Đang giao</option>
                            <option value="delivered">Đã giao</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái thanh toán
                        </label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => {
                                setPaymentStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả</option>
                            <option value="pending">Chưa thanh toán</option>
                            <option value="paid">Đã thanh toán</option>
                            <option value="failed">Thanh toán thất bại</option>
                            <option value="cancelled">Đã hủy</option>
                            <option value="refunded">Đã hoàn tiền</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phương thức thanh toán
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => {
                                setPaymentMethod(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả</option>
                            <option value="cod">COD</option>
                            <option value="bank_transfer">Chuyển khoản</option>
                            <option value="payos">PayOS</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleResetFilters}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Đặt lại bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-500">Đang tải...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={loadOrders}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Không có đơn hàng nào</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mã đơn
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Khách hàng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tổng tiền
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thanh toán
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày đặt
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order.order_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{order.order_code || order.order_id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{order.receiver_name}</div>
                                                <div className="text-sm text-gray-500">{order.receiver_phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(order.total_amount)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <OrderStatusBadge status={order.order_status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <PaymentStatusBadge status={order.payment_status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(order.order_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => navigate(`/admin/orders/${order.order_id}`)}
                                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                                >
                                                    Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Trước
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                ←
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                →
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Orders;
