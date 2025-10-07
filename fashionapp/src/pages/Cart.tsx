import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import ProductSlider from "../components/ProductSlider";
import { Link, useNavigate } from "react-router-dom";
import type { CartItem } from "../services/cartService";
import { useCart } from "../contexts/CartContext";
export default function Cart() {
    const navigate = useNavigate()
    const { 
        items, 
        totalPrice, 
        loading, 
        removeItem, 
        updateItemQuantity,
    } = useCart()

    const formatCurrency = (value: number) => value.toLocaleString("vi-VN");

    
    const shipping = 0;
    const grandTotal = totalPrice + shipping;

    

    const isEmpty = items.length === 0;

    return (
        <div
        className="min-h-screen flex flex-col">
            {/* Cart Content */}
            <div className="mt-10 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Cart Items or Empty State */}
                <div className="flex item-end justify-center flex-col">
                    {isEmpty ? (
                        <div className="w-full flex flex-col items-center justify-center text-center py-10">
                            <div className="w-56 h-56 rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
                                <ShoppingCart className="w-32 h-32 text-gray-800" />
                            </div>
                            <div className="mt-6 text-xl font-semibold text-gray-900">Giỏ hàng của bạn đang trống</div>
                            <div className="mt-1 text-gray-600">Hãy <span className="text-gray-800 font-medium">thêm</span> sản phẩm vào giỏ nhé!</div>
                            <a href="/" className="mt-6 inline-flex items-center justify-center px-8 py-3 rounded-full border border-gray-400 text-gray-800 hover:bg-gray-100 transition cursor-pointer">Mua sắm ngay</a>
                        </div>
                    ) : (
                    <>
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="font-semibold text-2xl">GIỎ HÀNG CỦA BẠN</h2>
                        <span>(Đang có <span className="font-bold">{items.length}</span> sản phẩm)</span>
                    </div>
                    <div className="mt-4">
                        <div className="border-b grid grid-cols-4 gap-4 p-4 text-gray-500 font-semibold">
                            <span className="col-span-2">Thông tin sản phẩm</span>
                            <span className="text-center">Số lượng</span>
                            <span className="text-center">Tổng cộng</span>
                        </div>
                        <div className="divide-y divide-gray-200l">
                            {items.map(item => (
                                <div className="grid grid-cols-4 gap-4 p-4 items-center" key={item.cart_item_id}>
                                    <div className="col-span-2 flex items-center gap-5">
                                        <img src={item.thumbnail} alt={item.product_name} className="w-20 h-20 rounded object-cover"  />
                                        <div className="flex flex-col gap-1">
                                            <h2 className="font-bold text-lg">{item.product_name}</h2>
                                            <span className="text-gray-500 text-sm">{item.variant.size.name} {item.variant.color ? `/ ${item.variant.color.name}` : ''}</span>

                                            <span className="text-gray-500 text-sm">{formatCurrency(item.price)}₫</span>
                                    
                                            
                                        </div>
                                    </div>
                                    <div className='flex flex-col items-center gap-2'>
                                        <div className='inline-flex items-center rounded mt-2 justify-between'>
                                            <button className='cursor-pointer' onClick={() => updateItemQuantity(item.cart_item_id, item.quantity - 1)} aria-label="Giảm số lượng">
                                                <Minus className="text-gray-400 w-4 h-4"/>
                                            </button>
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                                                    if (!isNaN(value) && value > 0) {
                                                        updateItemQuantity(item.cart_item_id, value);
                                                    }
                                                }}
                                                className='w-16 h-10 text-center text-lg font-semibold border-0 outline-none'
                                                style={{WebkitAppearance: 'none', MozAppearance: 'textfield'}}
                                            />
                                            <button className='cursor-pointer' onClick={() => updateItemQuantity(item.cart_item_id, item.quantity + 1)} aria-label="Tăng số lượng">
                                                <Plus className="text-gray-400 w-4 h-4"/>
                                            </button>
                                        </div>
                                        <button className="inline-flex w-fit items-center gap-1 text-red-500 hover:underline text-sm cursor-pointer" onClick={() => removeItem(item.cart_item_id)}>
                                                <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="text-md text-center font-bold text-black">{formatCurrency(item.price * item.quantity)}₫</div>
                                </div>
                            ))}
                            
                        </div>
                    </div>
                    </>
                    )}
                </div>
                {/* Right Column: Order Summary */}
                <div className="bg-gray-50 h-fit p-6 rounded-md shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">TÓM TẮT ĐƠN HÀNG</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Tạm tính</span>
                            <span className="font-medium">{formatCurrency(totalPrice)}₫</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Phí vận chuyển</span>
                            <span className="font-medium">{shipping === 0 ? 'Miễn phí' : `${formatCurrency(shipping)}₫`}</span>
                        </div>
                        <div className="border-t pt-3 flex items-center justify-between">
                            <span className="text-base font-semibold">Tổng cộng</span>
                            <span className="text-base font-bold text-red-500">{formatCurrency(grandTotal)}₫</span>
                        </div>
                    </div>
                    <button onClick={() => navigate('/order')} className="w-full mt-6 bg-black text-white py-3 rounded-md hover:bg-white hover:text-black hover:border-black border transition cursor-pointer">TIẾN HÀNH THANH TOÁN</button>
                    <Link to="/" className="block text-center mt-3 text-gray-600 hover:underline">Tiếp tục mua sắm</Link>
                </div>
            </div>
            <div className="mt-10">
                <h2 className="font-semibold text-2xl">GỢI Ý DÀNH CHO BẠN</h2>
                <ProductSlider></ProductSlider>
            </div>
        </div>
    )
}
