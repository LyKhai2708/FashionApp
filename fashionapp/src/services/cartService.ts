import { api } from '../utils/axios';
import type { ProductVariant } from '../types/product';

const LOCAL_STORAGE_CART_KEY = 'fashion_app_guest_cart';
export interface CartItem {
    cart_item_id: number;
    product_id: number;
    product_name: string;
    thumbnail: string;
    quantity: number;
    price: number; //final price
    variant: ProductVariant;
}

export interface AddToCartPayload {
    product_variants_id: number;
    quantity: number;
}



interface CartResponse {
    status: 'success';
    data: {
        cart: CartItem[];
        total_items: number;
        total_price: number;
    };
}

interface AddToCartResponse {
    status: 'success';
    data: {
        item: CartItem;
    };
}


class CartService {
    async getCart(): Promise<CartResponse['data']> {
        try {
            const response = await api.get<CartResponse>('/api/v1/cart');
            return response.data.data;
        } catch (error: any) {
            console.error('Get cart error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải giỏ hàng');
        }
    }

    async addToCart(payload: AddToCartPayload): Promise<CartItem> {
        try {
            const response = await api.post<AddToCartResponse>('/api/v1/cart', payload);
            return response.data.data.item;
        } catch (error: any) {
            console.error('Add to cart error:', error);
            throw new Error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
        }
    }

    async updateItemQuantity(cartItemId: number, quantity: number): Promise<void> {
        try {
            await api.put(`/api/v1/cart/${cartItemId}`, { quantity });
        } catch (error: any) {
            console.error('Update item quantity error:', error);
            throw new Error(error.response?.data?.message || 'Không thể cập nhật giỏ hàng');
        }
    }

    async removeItem(cartItemId: number): Promise<void> {
        try {
            await api.delete(`/api/v1/cart/${cartItemId}`);
        } catch (error: any) {
            console.error('Remove item error:', error);
            throw new Error(error.response?.data?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng');
        }
    }

    //guest
    getLocalCart(): CartItem[] {
        try {
            const localCartJson = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
            return localCartJson ? JSON.parse(localCartJson) : [];
        } catch (error) {
            return [];
        }
    }

    saveLocalCart(items: CartItem[]): void{
        localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(items));
    }

    clearLocalCart(): void {
        localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
    }

    async mergeLocalCartToServer(): Promise<void> {
        const localItems = this.getLocalCart();
        if (localItems.length === 0) {
            return;
        }

        const payload = {
            items: localItems.map(item => ({
                product_variants_id: item.variant.variant_id,
                quantity: item.quantity,
            })),
        };

        try {

            await api.put('/api/v1/cart/bulk-add', payload);
            this.clearLocalCart();
            console.log('Local cart merged to server successfully.');

        } catch (error) {
            console.error('Failed to merge local cart to server:', error);
            throw new Error('Không thể đồng bộ giỏ hàng của bạn.');
        }
    }
    
}

const cartService = new CartService();

export default cartService;