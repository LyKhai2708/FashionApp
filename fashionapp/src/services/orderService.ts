import api from '../utils/axios';

export interface OrderItem {
    product_variant_id: number;
    quantity: number;
    price: number;
}

export interface CreateOrderPayload {
    payment_method: string;
    shipping_province: string;
    shipping_province_code: number;
    shipping_ward: string;
    shipping_ward_code: number;
    shipping_detail_address: string;
    notes?: string;
    items: OrderItem[];
}

export interface Order {
    order_id: number;
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
    created_at: string;
    updated_at: string;
}

class OrderService {
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

    async getUserOrders(): Promise<Order[]> {
        try {
            const response = await api.get<any>('/api/v1/orders');
            return response.data.data.orders;
        } catch (error: any) {
            console.error('Get orders error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách đơn hàng');
        }
    }


    async getOrderById(orderId: number): Promise<Order> {
        try {
            const response = await api.get<any>(`/api/v1/orders/${orderId}`);
            return response.data.data.order;
        } catch (error: any) {
            console.error('Get order error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải thông tin đơn hàng');
        }
    }
}

export default new OrderService();
