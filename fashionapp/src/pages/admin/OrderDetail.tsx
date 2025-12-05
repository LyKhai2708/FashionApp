import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderService, { type Order } from '../../services/orderService';
import { getImageUrl } from '../../utils/imageHelper';
import OrderStatusBadge from '../../components/admin/OrderStatusBadge';
import PaymentStatusBadge from '../../components/admin/PaymentStatusBadge';


const OrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            loadOrderDetail();
        }
    }, [id]);

    const loadOrderDetail = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await orderService.getOrderById(Number(id));
            setOrder(data);
        } catch (err: any) {
            setError(err.message || 'Cannot load order information');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOrderStatus = async (newStatus: string) => {
        if (!order || !window.confirm(`Confirm updating order status to "${newStatus}"?`)) {
            return;
        }

        try {
            setUpdating(true);
            await orderService.updateOrderStatus(order.order_id, newStatus);
            await loadOrderDetail(); // Reload to get new data
            alert('Status updated successfully!');
        } catch (err: any) {
            alert(err.message || 'Cannot update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdatePaymentStatus = async (newStatus: string) => {
        if (!order || !window.confirm(`Confirm updating payment status to "${newStatus}"?`)) {
            return;
        }

        try {
            setUpdating(true);
            await orderService.updatePaymentStatus(order.order_id, newStatus);
            await loadOrderDetail();
            alert('Payment status updated successfully!');
        } catch (err: any) {
            alert(err.message || 'Cannot update payment status');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!order) return;

        const cancelReason = window.prompt('Enter cancellation reason:');
        if (!cancelReason || !cancelReason.trim()) {
            alert('Please enter a cancellation reason');
            return;
        }

        if (!window.confirm('Confirm order cancellation? This will restore stock and cannot be undone.')) {
            return;
        }

        try {
            setUpdating(true);
            await orderService.cancelOrder(order.order_id, cancelReason);
            await loadOrderDetail();
            alert('Order cancelled successfully!');
        } catch (err: any) {
            alert(err.message || 'Cannot cancel order');
        } finally {
            setUpdating(false);
        }
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Back to list
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Order Details #{order.order_code || order.order_id}
                    </h1>
                </div>
                <div className="flex items-center space-x-3">
                    <OrderStatusBadge status={order.order_status} />
                    <PaymentStatusBadge status={order.payment_status} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Ordered Products</h2>
                        <div className="space-y-4">
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                        {item.image_url && (
                                            <img
                                                src={getImageUrl(item.image_url)}
                                                alt={item.product_name}
                                                className="w-20 h-20 object-cover rounded"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {item.size_name} - {item.color_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Quantity: {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                {formatCurrency(item.price)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Total: {formatCurrency(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No products</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Receiver</p>
                                <p className="font-medium">{order.receiver_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone Number</p>
                                <p className="font-medium">{order.receiver_phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{order.receiver_email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium">
                                    {order.shipping_full_address ||
                                        `${order.shipping_detail_address}, ${order.shipping_ward}, ${order.shipping_province}`}
                                </p>
                            </div>
                            {order.notes && (
                                <div>
                                    <p className="text-sm text-gray-500">Notes</p>
                                    <p className="font-medium">{order.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatCurrency(order.sub_total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping Fee</span>
                                <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
                            </div>
                            {order.voucher_code && (
                                <div className="flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Voucher</span>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                                            {order.voucher_code}
                                        </span>
                                    </div>
                                    <span className="font-medium text-green-600">-{formatCurrency(order.voucher_discount_amount || 0)}</span>
                                </div>
                            )}
                            <div className="border-t pt-3 flex justify-between">
                                <span className="font-semibold">Total</span>
                                <span className="font-bold text-lg text-blue-600">
                                    {formatCurrency(order.total_amount)}
                                </span>
                            </div>
                            <div className="border-t pt-3">
                                <p className="text-sm text-gray-500">Payment Method</p>
                                <p className="font-medium">
                                    {order.payment_method === 'cod' ? 'COD' :
                                        order.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                                            order.payment_method === 'payos' ? 'PayOS' :
                                                order.payment_method === 'momo' ? 'MoMo' :
                                                    order.payment_method === 'vnpay' ? 'VNPay' :
                                                        order.payment_method}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Order Date</p>
                                <p className="font-medium">{formatDate(order.order_date)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Update Order Status</h2>
                        {order.order_status === 'cancelled' ? (
                            <div className="text-center py-4">
                                <p className="text-gray-500">Order has been cancelled</p>
                            </div>
                        ) : order.order_status === 'delivered' ? (
                            <div className="text-center py-4">
                                <p className="text-gray-500">Order has been completed</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleUpdateOrderStatus('pending')}
                                    disabled={updating || order.order_status === 'pending'}
                                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Reset to Pending
                                </button>
                                <button
                                    onClick={() => handleUpdateOrderStatus('processing')}
                                    disabled={updating || order.order_status === 'processing'}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Processing
                                </button>
                                <button
                                    onClick={() => handleUpdateOrderStatus('shipped')}
                                    disabled={updating || order.order_status === 'shipped'}
                                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Shipped
                                </button>
                                <button
                                    onClick={() => handleUpdateOrderStatus('delivered')}
                                    disabled={updating || order.order_status === 'delivered'}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Delivered
                                </button>
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={updating || order.order_status !== 'pending'}
                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel Order
                                </button>
                            </div>
                        )}
                    </div>

                    {(order.payment_status === 'pending') && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Update Payment</h2>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleUpdatePaymentStatus('paid')}
                                    disabled={updating}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Payment Received
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
