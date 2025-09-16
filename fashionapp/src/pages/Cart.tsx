import { useMemo, useState } from "react"
import product1 from "../assets/product1.jpg";
import product2 from "../assets/product2.jpg";
import product3 from "../assets/product3.jpg";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

export default function Cart() {
    interface CartItem {
        id: number;
        name: string;
        image: string;
        price: number;
        discount?: number;
        quantity: number;
        size?: string;
        color?: string;
    }

    const [cartItems, setCartItems] = useState<CartItem[]>([
        {
            id: 1,
            name: "Áo thun basic cotton",
            image: product1,
            price: 199000,
            discount: 10,
            quantity: 2,
            size: "M",
            color: "Trắng"
        },
        {
            id: 2,
            name: "Quần jeans slim fit",
            image: product2,
            price: 399000,
            quantity: 1,
            size: "32",
            color: "Xanh đậm"
        },
        {
            id: 3,
            name: "Áo khoác bomber",
            image: product3,
            price: 699000,
            discount: 15,
            quantity: 1,
            size: "L",
            color: "Đen"
        }
    ]);

    const formatCurrency = (value: number) => value.toLocaleString("vi-VN");

    const getUnitPriceAfterDiscount = (item: CartItem) => {
        if (!item.discount) return item.price;
        return Math.round(item.price * (1 - item.discount / 100));
    };

    const lineTotal = (item: CartItem) => getUnitPriceAfterDiscount(item) * item.quantity;

    const subtotal = useMemo(() => cartItems.reduce((sum, it) => sum + lineTotal(it), 0), [cartItems]);
    const shipping = 0;
    const grandTotal = subtotal + shipping;

    const updateQuantity = (id: number, delta: number) => {
        setCartItems(prev => prev.map(it => it.id === id ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it));
    };

    const setQuantity = (id: number, quantity: number) => {
        const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
        setCartItems(prev => prev.map(it => it.id === id ? { ...it, quantity: safeQuantity } : it));
    };

    const removeItem = (id: number) => setCartItems(prev => prev.filter(it => it.id !== id));
    const isEmpty = cartItems.length === 0;

    return (
        <div
        className="min-h-screen flex flex-col ">
            {/* Breadcrumb */}
            <div className="flex gap-2">
                <a href="/">Trang chủ</a>
                <span>/</span>
                <span className="text-gray-500">Giỏ hàng</span>
            </div>
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
                        <h2 className="font-semibold text-xl">GIỎ HÀNG CỦA BẠN</h2>
                        <span>(Đang có <span className="font-bold">{cartItems.length}</span> sản phẩm)</span>
                    </div>
                    <div className="mt-4">
                        <div className="border-b grid grid-cols-4 gap-4 p-4 text-gray-500 font-semibold">
                            <span className="col-span-2">Sản phẩm</span>
                            <span>Số lượng</span>
                            <span>Tổng cộng</span>
                        </div>
                        <div className="divide-y divide-gray-200l">
                            {cartItems.map(item => (
                                <div className="grid grid-cols-4 gap-4 p-4 items-center" key={item.id}>
                                    <div className="col-span-2 flex items-center gap-5">
                                        <img src={item.image} alt={item.name} className="w-20 h-20 rounded object-cover"  />
                                        <div className="flex flex-col gap-1">
                                            <h2 className="font-bold text-lg">{item.name}</h2>
                                            <span className="text-gray-500 text-sm">{item.size}/{item.color}</span>
                                            <button className="inline-flex w-fit items-center gap-1 text-red-500 hover:underline text-sm cursor-pointer" onClick={() => removeItem(item.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-4'>
                                        <div className='inline-flex items-center rounded mt-2 justify-between'>
                                            <button className='cursor-pointer' onClick={() => updateQuantity(item.id, -1)} aria-label="Giảm số lượng">
                                                <Minus className="text-gray-400 w-4 h-4"/>
                                            </button>
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                                                    setQuantity(item.id, isNaN(value) ? 1 : value);
                                                }}
                                                className='w-16 h-10 text-center text-lg font-semibold border-0 outline-none'
                                                style={{WebkitAppearance: 'none', MozAppearance: 'textfield'}}
                                            />
                                            <button className='cursor-pointer' onClick={() => updateQuantity(item.id, 1)} aria-label="Tăng số lượng">
                                                <Plus className="text-gray-400 w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-md font-bold text-black">{formatCurrency(lineTotal(item))}₫</div>
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
                            <span className="font-medium">{formatCurrency(subtotal)}₫</span>
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
                    <button className="w-full mt-6 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition cursor-pointer">TIẾN HÀNH THANH TOÁN</button>
                    <a href="/" className="block text-center mt-3 text-gray-600 hover:underline">Tiếp tục mua sắm</a>
                </div>
            </div>
        </div>
    )
}
