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
    receiver_name: string;        
    receiver_phone: string;       
    receiver_email: string;
    order_date: string;
    items?: OrderItemDetail[];
    items_count?: number;
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
            const response = await api.get<any>('/api/v1/orders/me');
            console.log(response);
            return response.data.data.orders;
        } catch (error: any) {
            console.error('Get orders error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách đơn hàng');
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

    async cancelOrder(orderId: number): Promise<void> {
        try {
            await api.delete(`/api/v1/orders/${orderId}`);
        } catch (error: any) {
            console.error('Cancel order error:', error);
            throw new Error(error.response?.data?.message || 'Không thể hủy đơn hàng');
        }
    }
}

export default new OrderService();
