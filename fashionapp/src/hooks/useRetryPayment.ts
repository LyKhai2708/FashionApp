import { useState, useEffect } from 'react';
import { message } from 'antd';
import paymentService from '../services/paymentService';

export const useRetryPayment = (orderId: number) => {
  const [loading, setLoading] = useState(false);
  const [expireAt, setExpireAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Load payment info để lấy expire_at
  useEffect(() => {
    const loadPaymentInfo = async () => {
      try {
        const paymentInfo = await paymentService.getPaymentInfo(orderId);
        setExpireAt(paymentInfo.expire_at);
      } catch (error) {
        console.error('Load payment info error:', error);
      }
    };

    if (orderId) {
      loadPaymentInfo();
    }
  }, [orderId]);

  useEffect(() => {
    if (!expireAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expire = new Date(expireAt).getTime();
      const diff = expire - now;
      
      if (diff > 0) {
        setTimeLeft(Math.floor(diff / 1000));
      } else {
        setTimeLeft(0);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expireAt]);

  const canRetry = timeLeft > 0;

  const retryPayment = async () => {
    if (!canRetry) {
      message.error('Thời gian thanh toán đã hết hạn. Vui lòng đặt hàng lại.');
      return;
    }

    setLoading(true);
    try {
      const paymentLink = await paymentService.createPaymentLink({
        orderId,
        returnUrl: `${window.location.origin}/order/success/${orderId}?payment=payos`,
        cancelUrl: `${window.location.origin}/payment/cancel/${orderId}`
      });
      
      window.location.href = paymentLink.checkoutUrl;
    } catch (error: any) {
      message.error(error.message || 'Không thể tạo link thanh toán mới');
      setLoading(false);
    }
  };

  return {
    retryPayment,
    loading,
    canRetry,
    timeLeft,
    expireAt
  };
};