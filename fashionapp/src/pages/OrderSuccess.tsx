import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Spin, message, Alert, Button } from 'antd';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import { formatVNDPrice } from '../utils/priceFormatter';
import { getImageUrl } from '../utils/imageHelper';
import { useRetryPayment } from '../hooks/useRetryPayment';
import { RetryPaymentButton } from '../components/RetryPaymentButton';

interface OrderItem {
    product_id: number;
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
    const location = useLocation();
    const [order, setOrder] = useState<OrderWithItems | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<string>('');
    const [checkingPayment, setCheckingPayment] = useState(false);

    const searchParams = new URLSearchParams(location.search);
    const paymentMethod = searchParams.get('payment');

    const { retryPayment, loading: retryLoading, canRetry } = useRetryPayment(Number(orderId));

    useEffect(() => {
        const loadOrder = async () => {
            if (!orderId) {
                message.error('Order not found');
                navigate('/');
                return;
            }

            try {
                setLoading(true);
                const orderData = await orderService.getOrderById(parseInt(orderId));
                setOrder(orderData as OrderWithItems);

                if (paymentMethod === 'payos') {
                    await checkPaymentStatus();
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Cannot load order information';
                message.error(errorMessage);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [orderId, navigate]);

    const checkPaymentStatus = async () => {
        if (!orderId) return;

        setCheckingPayment(true);
        try {
            const result = await paymentService.checkPaymentStatus(Number(orderId));
            setPaymentStatus(result.status);
        } catch (error) {
            console.error('Check payment error:', error);
        } finally {
            setCheckingPayment(false);
        }
    };


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

    if (checkingPayment) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
                    <div className="text-center py-8">
                        <Spin size="large" />
                        <p className="mt-4 text-gray-600">Checking payment status...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Render payment pending state
    if (paymentMethod === 'payos' && paymentStatus === 'PENDING') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center">
                            <Clock className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center mb-4">
                        Awaiting Payment
                    </h1>
                    <p className="text-center text-gray-600 mb-8">
                        Your payment is being processed. Please wait or check again.
                    </p>

                    <Alert
                        type="warning"
                        message="Awaiting payment confirmation"
                        description="Your transaction is being processed. This may take a few minutes."
                        className="mb-6"
                    />

                    <div className="flex gap-4">
                        <Button
                            size="large"
                            block
                            onClick={checkPaymentStatus}
                        >
                            Check again
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            block
                            onClick={() => navigate('/profile')}
                        >
                            View order
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Render payment failed/cancelled state
    if (paymentMethod === 'payos' && (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED')) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                            <XCircle className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center mb-4">
                        Payment Incomplete
                    </h1>
                    <p className="text-center text-gray-600 mb-8">
                        Payment was not successful. You can try again.
                    </p>

                    <Alert
                        type="error"
                        message="Payment failed"
                        description="Your order has not been paid. Please try again or choose another payment method."
                        className="mb-6"
                    />

                    {order && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Order code:</span>
                                    <span className="font-semibold">#{order.order_code || order.order_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total:</span>
                                    <span className="font-semibold text-lg text-red-600">
                                        {formatVNDPrice(order.total_amount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <RetryPaymentButton
                            onRetry={retryPayment}
                            loading={retryLoading}
                            disabled={!canRetry}
                            block
                        />

                        <Button
                            size="large"
                            block
                            onClick={() => navigate('/cart')}
                        >
                            Go to cart
                        </Button>
                    </div>
                </div>
            </div>
        );
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
                    Thank you for your order
                </h1>
                <p className="text-center text-gray-600 mb-2">
                    We have received your order and will deliver within 5-7 business days.
                </p>
                <p className="text-center text-gray-600 mb-8">
                    Your order code is <span className="font-semibold">#{order.order_code || order.order_id}</span>
                </p>

                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                    <div className="space-y-4 mb-6">
                        {order.items && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 py-3">
                                    <img
                                        src={getImageUrl(item.image_url)}
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
                                        <p className="font-medium">₫ {formatVNDPrice(item.price * item.quantity)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-4">
                                No products
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4 flex justify-between items-center">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-lg font-bold">₫ {formatVNDPrice(order.total_amount)}</span>
                    </div>
                </div>

                {/* Back to Home Button */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 border-2 border-black rounded-md hover:bg-black hover:text-white transition font-medium"
                    >
                        Back to homepage
                    </button>
                </div>
            </div>
        </div>
    );
}
