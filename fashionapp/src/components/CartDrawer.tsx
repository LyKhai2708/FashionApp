import { Drawer, Button, Divider } from 'antd'
import { ShoppingCart } from 'lucide-react'
import { Link } from "react-router-dom"
import { useCart } from '../contexts/CartContext';
import type { CartItem } from '../services/cartService';
import { getImageUrl } from '../utils/imageHelper';

export interface CartDrawerProps {
    open: boolean
    onClose: () => void
}

const formatCurrency = (value: number) => value.toLocaleString('vi-VN')

export default function CartDrawer(props: CartDrawerProps) {
    const { 
        items,
        totalPrice,
        totalItems, 
    } = useCart();
    const { open, onClose} = props
    
    const cartItems = Array.isArray(items) ? items : [];

    return (
        <Drawer
            title={<div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> <span>Giỏ hàng</span></div>}
            placement="right"
            width={420}
            onClose={onClose}
            open={open}
        >
            {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10">
                    <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center">
                        <ShoppingCart className="w-16 h-16 text-gray-500" />
                    </div>
                    <div className="mt-4 text-gray-600">Giỏ hàng trống</div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {cartItems.map(item => (
                        <div className="flex gap-3" key={item.cart_item_id}>
                            <img src={getImageUrl(item.thumbnail)} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                                <div className="font-semibold leading-5 line-clamp-2">{item.product_name}</div>
                                <div className="text-xs text-gray-500 mt-1">{item.variant.size.name} {item.variant.color ? `/ ${item.variant.color.name}` : ''}</div>
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="text-sm font-semibold">{formatCurrency(item.price)}₫</div>
                                    <div className="text-xs text-gray-600">Số lượng: <span className="font-medium text-gray-800">{item.quantity}</span></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Divider />
                    <div className="flex items-center justify-between text-base">
                        <span className="text-gray-600">Tổng tạm tính</span>
                        <span className="font-bold">{formatCurrency(totalPrice)}₫</span>
                    </div>
                    <Link to="/cart">
                        <Button  type="primary" size="large" className="!bg-black" block>
                            Xem giỏ hàng
                        </Button>
                    </Link>
                </div>
            )}
        </Drawer>
    )
}


