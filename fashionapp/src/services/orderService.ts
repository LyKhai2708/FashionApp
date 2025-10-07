import api from '../utils/axios';

export interface OrderItem {
    variant_id: number;
    quantity: number;
    price: number;
}

export interface CreateOrderPayload {
    fullName: string;
    email: string;
    phone: string;
    province: string;
    province_code: number;
    ward: string;
    ward_code: number;
    address: string;
    payment: string;
    items: OrderItem[];
    total_amount: number;
}

export interface Order {
    order_id: number;
    user_id: number;
    total_amount: number;
    status: string;
    shipping_address: string;
    payment_method: string;
    created_at: string;
    updated_at: string;
}

class OrderService {
    /**
     * Tạo đơn hàng mới
     */
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

    /**
     * Lấy danh sách đơn hàng của user
     */
    async getUserOrders(): Promise<Order[]> {
        try {
            const response = await api.get<any>('/api/v1/orders');
            return response.data.data.orders;
        } catch (error: any) {
            console.error('Get orders error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách đơn hàng');
        }
    }

    /**
     * Lấy chi tiết đơn hàng
     */
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
