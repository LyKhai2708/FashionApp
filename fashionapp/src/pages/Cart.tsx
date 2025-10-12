import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import ProductSlider from "../components/ProductSlider";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useState } from "react";
import { message } from "antd";

export default function Cart() {
    const navigate = useNavigate()
    const { 
        items, 
        totalPrice, 
        loading, 
        removeItem, 
        updateItemQuantity,
    } = useCart()

    const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
    const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());

    const formatCurrency = (value: number) => value.toLocaleString("vi-VN");

    const handleUpdateQuantity = async (itemId: number, newQuantity: number, stockQuantity: number) => {
        if (newQuantity < 1) {
            message.warning('Số lượng tối thiểu là 1');
            return;
        }
        if (newQuantity > stockQuantity) {
            message.warning(`Chỉ còn ${stockQuantity} sản phẩm trong kho`);
            return;
        }

        setUpdatingItems(prev => new Set(prev).add(itemId));
        try {
            await updateItemQuantity(itemId, newQuantity);
        } catch {
            message.error('Cập nhật thất bại');
        } finally {
            setUpdatingItems(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        setDeletingItems(prev => new Set(prev).add(itemId));
        try {
            await removeItem(itemId);
            setDeletingItems(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        } catch {
            message.error('Xóa thất bại');
            setDeletingItems(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };
    
    const FREE_SHIP_THRESHOLD = 200000;
    const STANDARD_SHIPPING_FEE = 30000;
    const shipping = totalPrice >= FREE_SHIP_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    const grandTotal = totalPrice + shipping;

    const isEmpty = items.length === 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
                </div>
            </div>
        );
    }

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
                            {items.map(item => {
                                const isUpdating = updatingItems.has(item.cart_item_id);
                                const isDeleting = deletingItems.has(item.cart_item_id);
                                const isDisabled = isUpdating || isDeleting;
                                
                                return (
                                <div 
                                    className={`grid grid-cols-4 gap-4 p-4 items-center transition-opacity ${isDeleting ? 'opacity-50' : ''}`} 
                                    key={item.cart_item_id}
                                >
                                    <div className="col-span-2 flex items-center gap-5">
                                        <img src={item.thumbnail} alt={item.product_name} className="w-20 h-20 rounded object-cover"  />
                                        <div className="flex flex-col gap-1">
                                            <h2 className="font-bold text-lg">{item.product_name}</h2>
                                            <span className="text-gray-500 text-sm">{item.variant.size.name} {item.variant.color ? `/ ${item.variant.color.name}` : ''}</span>
                                            <span className="text-gray-500 text-sm">{formatCurrency(item.price)}₫</span>
                                            {item.variant.stock_quantity < 10 && (
                                                <span className="text-orange-500 text-xs font-medium">
                                                    Chỉ còn {item.variant.stock_quantity} sản phẩm
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className='flex flex-col items-center gap-2'>
                                        <div className='inline-flex items-center rounded mt-2 justify-between'>
                                            <button 
                                                className={`cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity - 1, item.variant.stock_quantity)} 
                                                disabled={isDisabled}
                                                aria-label="Giảm số lượng"
                                            >
                                                <Minus className="text-gray-400 w-4 h-4"/>
                                            </button>
                                            <input
                                                type="number"
                                                min={1}
                                                max={item.variant.stock_quantity}
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                                                    if (!isNaN(value) && value > 0) {
                                                        handleUpdateQuantity(item.cart_item_id, value, item.variant.stock_quantity);
                                                    }
                                                }}
                                                disabled={isDisabled}
                                                className='w-16 h-10 text-center text-lg font-semibold border-0 outline-none disabled:opacity-50'
                                                style={{WebkitAppearance: 'none', MozAppearance: 'textfield'}}
                                            />
                                            <button 
                                                className={`cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity + 1, item.variant.stock_quantity)} 
                                                disabled={isDisabled}
                                                aria-label="Tăng số lượng"
                                            >
                                                <Plus className="text-gray-400 w-4 h-4"/>
                                            </button>
                                        </div>
                                        <button 
                                            className={`inline-flex w-fit items-center gap-1 text-red-500 hover:underline text-sm ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            onClick={() => handleRemoveItem(item.cart_item_id)}
                                            disabled={isDisabled}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {isDeleting && <span className="text-xs">Đang xóa...</span>}
                                        </button>
                                    </div>
                                    <div className="text-md text-center font-bold text-black">{formatCurrency(item.price * item.quantity)}₫</div>
                                </div>
                                );
                            })}
                            
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
                        {totalPrice < FREE_SHIP_THRESHOLD && totalPrice > 0 && (
                            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                Mua thêm {formatCurrency(FREE_SHIP_THRESHOLD - totalPrice)}₫ để được miễn phí ship!
                            </div>
                        )}
                        <div className="border-t pt-3 flex items-center justify-between">
                            <span className="text-base font-semibold">Tổng cộng</span>
                            <span className="text-base font-bold text-red-500">{formatCurrency(grandTotal)}₫</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/order')} 
                        disabled={isEmpty || updatingItems.size > 0 || deletingItems.size > 0}
                        className="w-full mt-6 bg-black text-white py-3 rounded-md hover:bg-white hover:text-black hover:border-black border transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        TIẾN HÀNH THANH TOÁN
                    </button>
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
