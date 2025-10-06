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
    addToCart: (payload: AddToCartPayload, productDetails: Omit<CartItem, 'cart_item_id' | 'quantity'>) => Promise<void>;
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
        if (isAuthenticated) {
            try {
                setCartState(prev => ({ ...prev, loading: true }));
                await cartService.mergeLocalCartToServer();
                const { cart, total_items, total_price } = await cartService.getCart();
                setCartState({ items: cart, totalItems: total_items, totalPrice: total_price, loading: false, error: null });
            } catch (error: any) {
                setCartState(prev => ({ ...prev, loading: false, error: error.message }));
            }
        }else{
            const localItems = cartService.getLocalCart();
            const totalItems = localItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalPrice = localItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            setCartState({ items: localItems, totalItems, totalPrice, loading: false, error: null });
        }
        
    };

    useEffect(() => {
        fetchCart();
    }, [isAuthenticated]);

    const addToCart = async (payload: AddToCartPayload, productDetails: Omit<CartItem, 'cart_item_id' | 'quantity'>) => {
        if(isAuthenticated){
            try{
                await cartService.addToCart(payload);
                message.success('Thêm sản phẩm vào giỏ hàng thành công');
                await fetchCart();
            }catch(err: any) {
                message.error(err.message || 'Thêm sản phẩm vào giỏ hàng thất bại');
                throw err;
            }
        }else{
            const localItems = cartService.getLocalCart();
            const existingItemIndex = localItems.findIndex(item => item.variant.variant_id === payload.product_variants_id);
            
            if(existingItemIndex > -1) {
                localItems[existingItemIndex].quantity += payload.quantity;
            }else{
                const newItem: CartItem = {
                    ...productDetails,
                    cart_item_id: 0,
                    quantity: payload.quantity,
                }
                localItems.push(newItem);
            }
            cartService.saveLocalCart(localItems);
            
            await fetchCart();
            message.success('Thêm sản phẩm vào giỏ hàng thành công');
            
        }
        
    };

    const updateItemQuantity = async (itemId: number, quantity: number) => {
        if (quantity <= 0) {
            await removeItem(itemId);
            return;
        }
        if (isAuthenticated) {
            try {
                await cartService.updateItemQuantity(itemId, quantity);
                await fetchCart(); 
            } catch (error: any) {
                message.error(error.message || 'Cập nhật thất bại');
                throw error;
            }
        } else {
            const localItems = cartService.getLocalCart();
            const itemIndex = localItems.findIndex(item => item.cart_item_id === itemId);
    
            if (itemIndex > -1) {
                localItems[itemIndex].quantity = quantity;
                cartService.saveLocalCart(localItems);
                await fetchCart(); 
            }
        }
    };


    const removeItem = async (itemId: number) => {
        if (isAuthenticated) {
            try {
                await cartService.removeItem(itemId);
                message.success('Đã xóa sản phẩm khỏi giỏ hàng');
                await fetchCart();
            } catch (error: any) {
                message.error(error.message || 'Xóa thất bại');
                throw error;
            }
        } else {
            let localItems = cartService.getLocalCart();
            localItems = localItems.filter(item => item.cart_item_id !== itemId);
            cartService.saveLocalCart(localItems);
            
            await fetchCart();
            message.success('Đã xóa sản phẩm khỏi giỏ hàng');
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