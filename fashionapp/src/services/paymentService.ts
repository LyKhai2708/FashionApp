import { api } from '../utils/axios';

export interface CreatePaymentLinkRequest {
  orderId: number;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentLinkResponse {
  checkoutUrl: string;
  orderCode: number;
  amount: number;
  orderId: number;
}

export interface PaymentStatusResponse {
  status: string;
  message: string;
}

class PaymentService {
  async createPaymentLink(data: CreatePaymentLinkRequest): Promise<PaymentLinkResponse> {
    const response = await api.post('/payments/create', data);
    return response.data.data;
  }

  async checkPaymentStatus(orderId: number): Promise<PaymentStatusResponse> {
    const response = await api.get(`/payments/check/${orderId}`);
    return response.data.data;
  }

  async cancelPayment(orderId: number): Promise<{ message: string }> {
    const response = await api.delete(`/payments/cancel/${orderId}`);
    return response.data.data;
  }

  async getPaymentInfo(orderId: number) {
    const response = await api.get(`/payments/info/${orderId}`);
    return response.data.data;
  }

  async updatePaymentStatus(orderId: number, status: string, transactionId?: string) {
    const response = await api.patch(`/payments/admin/status/${orderId}`, {
      payment_status: status,
      transaction_id: transactionId
    });
    return response.data.data;
  }
}

export default new PaymentService();