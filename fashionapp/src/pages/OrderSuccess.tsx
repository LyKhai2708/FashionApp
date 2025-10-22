import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Spin, message, Alert, Button } from 'antd';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import type { Order } from '../services/orderService';
import { formatVNDPrice } from '../utils/priceFormatter';
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
                message.error('Không tìm thấy đơn hàng');
                navigate('/');
                return;
            }

            try {
                setLoading(true);
                const orderData = await orderService.getOrderById(parseInt(orderId));
                setOrder(orderData as OrderWithItems);
                
                // Nếu là PayOS payment, check status
                if (paymentMethod === 'payos') {
                    await checkPaymentStatus();
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin đơn hàng';
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
                        <p className="mt-4 text-gray-600">Đang kiểm tra trạng thái thanh toán...</p>
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
                        Đang chờ thanh toán
                    </h1>
                    <p className="text-center text-gray-600 mb-8">
                        Thanh toán của bạn đang được xử lý. Vui lòng đợi hoặc kiểm tra lại.
                    </p>
                    
                    <Alert
                        type="warning"
                        message="Đang chờ xác nhận thanh toán"
                        description="Giao dịch của bạn đang được xử lý. Quá trình này có thể mất vài phút."
                        className="mb-6"
                    />
                    
                    <div className="flex gap-4">
                        <Button 
                            size="large" 
                            block
                            onClick={checkPaymentStatus}
                        >
                            Kiểm tra lại
                        </Button>
                        <Button 
                            type="primary"
                            size="large" 
                            block
                            onClick={() => navigate('/profile')}
                        >
                            Xem đơn hàng
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
                        Thanh toán chưa hoàn tất
                    </h1>
                    <p className="text-center text-gray-600 mb-8">
                        Giao dịch thanh toán chưa thành công. Bạn có thể thử thanh toán lại.
                    </p>
                    
                    <Alert
                        type="error"
                        message="Thanh toán thất bại"
                        description="Đơn hàng của bạn chưa được thanh toán. Vui lòng thử lại hoặc chọn phương thức thanh toán khác."
                        className="mb-6"
                    />
                    
                    {order && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mã đơn hàng:</span>
                                    <span className="font-semibold">#{order.order_code || order.order_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tổng tiền:</span>
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
                            Về giỏ hàng
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
                    Cảm ơn bạn đã mua hàng
                </h1>
                <p className="text-center text-gray-600 mb-2">
                    Chúng tôi đã nhận được đơn hàng của bạn và sẽ giao hàng trong 5-7 ngày làm việc.
                </p>
                <p className="text-center text-gray-600 mb-8">
                    Số đơn hàng của bạn là <span className="font-semibold">#{order.order_code || order.order_id}</span>
                </p>

                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-6">Tóm tắt đơn hàng</h2>

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
                                        <p className="font-medium">₫ {formatVNDPrice(item.price * item.quantity)}</p>
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
                        <span className="text-lg font-semibold">Tổng</span>
                        <span className="text-lg font-bold">₫ {formatVNDPrice(order.total_amount)}</span>
                    </div>
                </div>

                {/* Back to Home Button */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 border-2 border-black rounded-md hover:bg-black hover:text-white transition font-medium"
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
}
