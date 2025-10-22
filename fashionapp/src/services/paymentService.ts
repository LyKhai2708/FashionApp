import { api } from '../utils/axios';

export interface CreatePaymentLinkRequest {
  orderId: number;
  returnUrl?: string;
  cancelUrl?: string;
}

interface PaymentInfo {
  payment_id: number;
  order_id: number;
  payment_status: string;
  payment_method: string;
  expire_at: string;
  payos_order_code: string;
  payos_checkout_url: string;
}
export interface PaymentLinkResponse {
  checkoutUrl: string;
  orderCode: number;
  amount: number;
  orderId: number;
  expireAt: string;
}

export interface PaymentStatusResponse {
  status: string;
  message: string;
}

class PaymentService {
  async createPaymentLink(data: CreatePaymentLinkRequest): Promise<PaymentLinkResponse> {
    const response = await api.post('/api/v1/payments/create', data);
    return response.data.data;
  }

  async checkPaymentStatus(orderId: number): Promise<PaymentStatusResponse> {
    const response = await api.get(`/api/v1/payments/check/${orderId}`);
    return response.data.data;
  }

  async cancelPayment(orderId: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/v1/payments/cancel/${orderId}`);
    return response.data.data;
  }

  async getPaymentInfo(orderId: number): Promise<PaymentInfo> {
    const response = await api.get(`/api/v1/payments/info/${orderId}`);
    return response.data.data.payment;
  }

  async updatePaymentStatus(orderId: number, status: string, transactionId?: string) {
    const response = await api.patch(`/api/v1/payments/admin/status/${orderId}`, {
      payment_status: status,
      transaction_id: transactionId
    });
    return response.data.data;
  }
}

export default new PaymentService();