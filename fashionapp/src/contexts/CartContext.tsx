import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import cartService from '../services/cartService';
import type { CartItem, AddToCartPayload } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useMessage } from '../App';

interface CartState {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    loading: boolean;
    error: string | null;
}

interface CartContextType extends CartState {
    fetchCart: () => Promise<void>;
    addToCart: (payload: AddToCartPayload) => Promise<void>;
    updateItemQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);


export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({children}: {children: ReactNode}) =>{
    const {isAuthenticated} = useAuth();
    const message = useMessage();
    const [cartState, setCartState] = useState<CartState>({
        items: [],
        totalItems: 0,
        totalPrice: 0,
        loading: false,
        error: null,
    });

    const fetchCart = async () => {
        if (!isAuthenticated) {
            setCartState({ items: [], totalItems: 0, totalPrice: 0, loading: false, error: null });
            return;
        }
        try {
            setCartState(prev => ({ ...prev, loading: true }));
            const { cart, total_items, total_price } = await cartService.getCart();
            setCartState({ items: cart, totalItems: total_items, totalPrice: total_price, loading: false, error: null });
        } catch (error: any) {
            setCartState(prev => ({ ...prev, loading: false, error: error.message }));
        }
    };

    useEffect(() => {
        fetchCart();
    }, [isAuthenticated]);

    const addToCart = async (payload: AddToCartPayload) => {
        try{
            await cartService.addToCart(payload);
            message.success('Thêm sản phẩm vào giỏ hàng thành công');
            await fetchCart();
        }catch(err: any) {
            message.error(err.message || 'Thêm sản phẩm vào giỏ hàng thất bại');
            throw err;
        }
    };

    const updateItemQuantity = async (itemId: number, quantity: number) => {
        try {
            await cartService.updateItemQuantity(itemId, quantity);
            await fetchCart();
        } catch (error: any) {
            message.error(error.message || 'Cập nhật thất bại');
            throw error;
        }
    };


    const removeItem = async (itemId: number) => {
        try {
            await cartService.removeItem(itemId);
            message.success('Đã xóa sản phẩm khỏi giỏ hàng');
            await fetchCart();
        } catch (error: any) {
            message.error(error.message || 'Xóa thất bại');
            throw error;
        }
    };

    const value = {
        ...cartState,
        fetchCart,
        addToCart,
        updateItemQuantity,
        removeItem,
    };

    return <CartContext.Provider value={value}>
        {children}
    </CartContext.Provider>;

}