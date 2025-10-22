import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button, Spin } from 'antd';
import { useRetryPayment } from '../hooks/useRetryPayment';
import { PaymentCountdown } from '../components/PaymentCountdown';
import { RetryPaymentButton } from '../components/RetryPaymentButton';
import orderService from '../services/orderService';

export default function PaymentCancel() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    retryPayment, 
    loading: retryLoading, 
    canRetry, 
    timeLeft 
  } = useRetryPayment(Number(orderId));

  // Load order data
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;
      
      try {
        const orderData = await orderService.getOrderById(parseInt(orderId));
        setOrder(orderData);
      } catch (error) {
        console.error('Load order error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
        {/* Icon & Title */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-4">
          Thanh toán đã bị hủy
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Giao dịch đã bị hủy. Bạn có thể thử lại hoặc chọn phương thức thanh toán khác.
        </p>

        {/* Order Info */}
        {order && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-semibold">#{order.order_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-semibold text-lg text-red-600">
                  {order.total_amount?.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Countdown Timer */}
        <div className="mb-6">
          <PaymentCountdown timeLeft={timeLeft} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            type="default" 
            size="large"
            block
            onClick={() => navigate('/cart')}
          >
            Về giỏ hàng
          </Button>
          
          <RetryPaymentButton
            onRetry={retryPayment}
            loading={retryLoading}
            disabled={!canRetry}
            block
          />
        </div>

        {/* Help Text */}
        {!canRetry && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Đơn hàng đã hết hạn thanh toán. Vui lòng đặt hàng mới từ giỏ hàng.
          </p>
        )}
      </div>
    </div>
  );
}