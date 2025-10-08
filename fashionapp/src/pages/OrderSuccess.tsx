import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Spin, message } from 'antd';
import orderService from '../services/orderService';
import type { Order } from '../services/orderService';

interface OrderItem {
    product_name: string;
    size_name: string;
    color_name: string;
    quantity: number;
    price: number;
    image_url: string;
}

interface OrderWithItems extends Order {
    items: OrderItem[];
}

export default function OrderSuccess() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderWithItems | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrder = async () => {
            if (!orderId) {
                message.error('Không tìm thấy đơn hàng');
                navigate('/');
                return;
            }

            try {
                setLoading(true);
                const orderData = await orderService.getOrderById(parseInt(orderId));
                setOrder(orderData as OrderWithItems);
            } catch (error: any) {
                message.error(error.message || 'Không thể tải thông tin đơn hàng');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [orderId, navigate]);

    const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (!order) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center mb-4">
                    Thank you for your purchase
                </h1>
                <p className="text-center text-gray-600 mb-2">
                    We've received your order will ship in 5-7 business days.
                </p>
                <p className="text-center text-gray-600 mb-8">
                    Your order number is <span className="font-semibold">#{order.order_id}</span>
                </p>

                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                    <div className="space-y-4 mb-6">
                        {order.items && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 py-3">
                                    <img 
                                        src={item.image_url} 
                                        alt={item.product_name}
                                        className="w-16 h-16 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-medium">{item.product_name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {item.size_name && `Size: ${item.size_name}`}
                                            {item.color_name && ` • ${item.color_name}`}
                                            {` • Qty: ${item.quantity}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">₫ {formatCurrency(item.price * item.quantity)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-4">
                                Không có sản phẩm
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4 flex justify-between items-center">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-lg font-bold">₫ {formatCurrency(order.total_amount)}</span>
                    </div>
                </div>

                {/* Back to Home Button */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 border-2 border-black rounded-md hover:bg-black hover:text-white transition font-medium"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
