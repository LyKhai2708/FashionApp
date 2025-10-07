import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import cartService from '../services/cartService';
import type { CartItem, AddToCartPayload } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useMessage, useNotification } from '../App';

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
    const notification = useNotification();
    const [cartState, setCartState] = useState<CartState>({
        items: [],
        totalItems: 0,
        totalPrice: 0,
        loading: false,
        error: null,
    });
    const [hasMerged, setHasMerged] = useState(false);

    const fetchCart = async (skipMerge = false) => {
        if (isAuthenticated) {
            try {
                setCartState(prev => ({ ...prev, loading: true }));
                
                // Only merge once when user logs in
                if (!skipMerge && !hasMerged) {
                    await cartService.mergeLocalCartToServer();
                    setHasMerged(true);
                }
                
                const { cart, total_items, total_price } = await cartService.getCart();
                setCartState({ items: cart, totalItems: total_items, totalPrice: total_price, loading: false, error: null });
            } catch (error: any) {
                setCartState(prev => ({ ...prev, loading: false, error: error.message }));
            }
        }else{
            setHasMerged(false)
            const localItems = cartService.getLocalCart();
            const totalPrice = localItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            setCartState({ items: localItems, totalItems: localItems.length, totalPrice, loading: false, error: null });
        }
        
    };

    useEffect(() => {

            fetchCart();
        
    }, [isAuthenticated]);

    const showAddToCartNotification = (productDetails: Omit<CartItem, 'cart_item_id' | 'quantity'>, quantity: number) => {
        notification.success({
            message: 'Đã thêm vào giỏ hàng',
            description: (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img 
                        src={productDetails.thumbnail} 
                        alt={productDetails.product_name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{productDetails.product_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {productDetails.variant.size.name} {productDetails.variant.color ? `/ ${productDetails.variant.color.name}` : ''}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Số lượng: {quantity}</div>
                    </div>
                </div>
            ),
            placement: 'bottomRight',
            duration: 3,
        });
    };

    const addToCart = async (payload: AddToCartPayload, productDetails: Omit<CartItem, 'cart_item_id' | 'quantity'>) => {
        if(isAuthenticated){
            try{
                await cartService.addToCart(payload);
                showAddToCartNotification(productDetails, payload.quantity);
                await fetchCart(true); // Skip merge when adding to cart
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
                    cart_item_id: payload.product_variants_id,
                    quantity: payload.quantity,
                }
                localItems.push(newItem);
            }
            cartService.saveLocalCart(localItems);
            
            await fetchCart();
            showAddToCartNotification(productDetails, payload.quantity);
            
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
                await fetchCart(true); // Skip merge
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
                await fetchCart(true);
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