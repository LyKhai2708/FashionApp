import api from '../utils/axios';

export interface OrderItem {
    product_variant_id: number;
    quantity: number;
    price: number;
}

export interface CreateOrderPayload {
    receiver_name: string;        
    receiver_phone: string;       
    receiver_email: string;
    payment_method: string;
    shipping_province: string;
    shipping_province_code: number;
    shipping_ward: string;
    shipping_ward_code: number;
    shipping_detail_address: string;
    notes?: string;
    items: OrderItem[];
}

export interface OrderItemDetail {
    product_id: number;
    product_name: string;
    size_name: string;
    color_name: string;
    quantity: number;
    price: number;
    image_url: string;
}

export interface Order {
    order_id: number;
    order_code: string;
    user_id: number;
    order_status: string;
    sub_total: number;
    shipping_fee: number;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    notes?: string;
    shipping_province: string;
    shipping_province_code: number;
    shipping_ward: string;
    shipping_ward_code: number;
    shipping_detail_address: string;
    shipping_full_address?: string;
    receiver_name: string;        
    receiver_phone: string;       
    receiver_email: string;
    order_date: string;
    shipped_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
    cancel_reason?: string;
    updated_by?: number;
    updated_at?: string;
    items?: OrderItemDetail[];
    items_count?: number;
}

class OrderService {

        async getAllOrders(params?: {
        order_status?: string;
        payment_status?: string;
        payment_method?: string;
        start_date?: string;
        end_date?: string;
        page?: number;
        limit?: number;
    }): Promise<{ orders: Order[]; pagination: any }> {
        try {
            const response = await api.get('/api/v1/orders', { params });
        
            return {
                orders: response.data.data.orders || [],
                pagination: response.data.data.pagination
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể lấy danh sách đơn hàng');
        }
    }

    async updateOrderStatus(orderId: number, orderStatus: string): Promise<void> {
    try {
        await api.patch(`/api/v1/orders/${orderId}/status`, {
            order_status: orderStatus
        });
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
    }

    async updatePaymentStatus(orderId: number, paymentStatus: string): Promise<void> {
    try {
        await api.patch(`/api/v1/orders/${orderId}/payment-status`, {
            payment_status: paymentStatus
        });
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái thanh toán');
    }
}
    async createOrder(payload: CreateOrderPayload): Promise<Order> {
        try {
            console.log('Creating order with payload:', payload);
            
            const response = await api.post<any>('/api/v1/orders', payload);
            return response.data.data.order;
        } catch (error: any) {
            console.error('Create order error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tạo đơn hàng');
        }
    }

    async getUserOrders(page: number = 1, limit: number = 5): Promise<{ orders: Order[]; pagination: { total: number; total_pages: number; current_page: number; per_page: number } }> {
        try {
            const response = await api.get(`/api/v1/orders/me`, {
                params: { page, limit }
            });
            return {
                orders: response.data.data.orders || [],
                pagination: response.data.data.pagination
            };
        } catch (error) {
            const message = error instanceof Error && 'response' in error && error.response ? 
                (error.response as { data?: { message?: string } }).data?.message : undefined;
            throw new Error(message || 'Không thể tải danh sách đơn hàng');
        }
    }


    async getOrderById(orderId: number): Promise<Order> {
        try {
            const response = await api.get<any>(`/api/v1/orders/${orderId}`);
            console.log(response);
            return response.data.data.order;
        } catch (error: any) {
            console.error('Get order error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải thông tin đơn hàng');
        }
    }

    async cancelOrder(orderId: number, cancelReason: string): Promise<void> {
        try {
            await api.delete(`/api/v1/orders/${orderId}/cancel`, {
                data: {
                    cancel_reason: cancelReason
                }
            });
        } catch (error: any) {
            console.error('Cancel order error:', error);
            throw new Error(error.response?.data?.message || 'Không thể hủy đơn hàng');
        }
    }
}

export default new OrderService();
