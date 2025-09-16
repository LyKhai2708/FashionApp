import { Menu , ShoppingCart , User, Search, CameraIcon } from "lucide-react"
import { useMemo, useState } from "react"
import CartDrawer from "../components/CartDrawer"
import type { CartItem } from "../components/CartDrawer"
import product1 from "../assets/product1.jpg"
import product2 from "../assets/product2.jpg"
import product3 from "../assets/product3.jpg"
import { Link } from "react-router-dom"

export default function Header() {
    const [openCart, setOpenCart] = useState(false)
    const [cartItems] = useState<CartItem[]>([
      { id: 1, name: "Áo thun basic cotton", image: product1, price: 199000, discount: 10, quantity: 2, size: "M", color: "Trắng" },
      { id: 2, name: "Quần jeans slim fit", image: product2, price: 399000, quantity: 1, size: "32", color: "Xanh đậm" },
      { id: 3, name: "Áo khoác bomber", image: product3, price: 699000, discount: 15, quantity: 1, size: "L", color: "Đen" }
    ])
    const cartCount = useMemo(() => cartItems.reduce((n, it) => n + it.quantity, 0), [cartItems])
    // Read-only drawer: no handlers used here
    return (
        <header className="w-full bg-white shadow sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1660px] flex items-center justify-between py-3">
        
        {/* Menu (mobile) */}
        <button className="md:hidden">
          <Menu className="w-6 h-6 text-gray-700 cursor-pointer" />
        </button>
        
        {/* Logo */}
        <a  href="#" className="text-xl font-bold text-black-600">DELULU</a>

        

        {/* Navigation (ẩn ở mobile, hiện khi md+) */}
        <nav className="hidden md:flex space-x-10 text-gray-700 font-medium text-lg">
          <a href="#" className="border-b-2 border-transparent hover:border-b-2 hover:border-black transition-colors">Sản phẩm mới</a>
          <a href="#" className="border-b-2 border-transparent hover:border-b-2 hover:border-black transition-colors">Nam</a>
          <a href="#" className="border-b-2 border-transparent hover:border-b-2 hover:border-black transition-colors">Nữ</a>
          <a href="#" className="border-b-2 border-transparent hover:border-b-2 hover:border-black transition-colors">Thương hiệu</a>
        </nav>
        <div className="flex items-center space-x-4">
          <div className="flex item-center space-x-2 border-b-2 border-gray-300">
            <Search className="w-5 h-10 text-gray-700 cursor-pointer" />
            <input type="text" placeholder="Tìm kiếm" className="rounded-md focus:outline-none" />
            <CameraIcon className="w-5 h-10 text-gray-700 cursor-pointer hover:text-blue-600" />
          </div>
          {/* Action icons */}
          <div className="flex items-center space-x-4">
            <div className="relative" onClick={() => setOpenCart(true)}>
              <ShoppingCart className="w-6 h-6 cursor-pointer text-gray-700 hover:text-blue-600" />
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs leading-5 text-center select-none">
                {cartCount}
              </span>
            </div>
            <Link to={"/login"}><User className="w-6 h-6 cursor-pointer text-gray-700 hover:text-blue-600" /></Link>
          </div>
        </div>
        {/* Search */}
        
      </div>
      <CartDrawer open={openCart} onClose={() => setOpenCart(false)} items={cartItems} />
    </header>
    )
}