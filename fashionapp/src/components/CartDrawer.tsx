import { Drawer, Button, Divider } from 'antd'
import { ShoppingCart } from 'lucide-react'
import { Link } from "react-router-dom"
import { useCart } from '../contexts/CartContext';

export interface CartDrawerProps {
    open: boolean
    onClose: () => void
}

const formatCurrency = (value: number) => value.toLocaleString('vi-VN')

const getUnitPriceAfterDiscount = (item: any) => {
    if (!item.discount) return item.price
    return Math.round(item.price * (1 - item.discount / 100))
}

export default function CartDrawer(props: CartDrawerProps) {
    const { 
        items, 
    } = useCart();
    const { open, onClose} = props
    const subtotal = items.reduce((sum, it) => sum + getUnitPriceAfterDiscount(it) * it.quantity, 0)

    return (
        <Drawer
            title={<div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> <span>Giỏ hàng</span></div>}
            placement="right"
            width={420}
            onClose={onClose}
            open={open}
        >
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10">
                    <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center">
                        <ShoppingCart className="w-16 h-16 text-gray-500" />
                    </div>
                    <div className="mt-4 text-gray-600">Giỏ hàng trống</div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {items.map(item => (
                        <div className="flex gap-3" key={item.product_id}>
                            <img src={item.thumbnail} alt={item.product_name} className="w-20 h-24 object-cover rounded" />
                            <div className="flex-1">
                                <div className="font-semibold leading-5 line-clamp-2">{item.product_name}</div>
                                <div className="text-xs text-gray-500 mt-1">{item.variant.size.name} {item.variant.color ? `/ ${item.variant.color.name}` : ''}</div>
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="text-sm font-semibold">{formatCurrency(getUnitPriceAfterDiscount(item))}₫</div>
                                    <div className="text-xs text-gray-600">Số lượng: <span className="font-medium text-gray-800">{item.quantity}</span></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Divider />
                    <div className="flex items-center justify-between text-base">
                        <span className="text-gray-600">Tổng tạm tính</span>
                        <span className="font-bold">{formatCurrency(subtotal)}₫</span>
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


