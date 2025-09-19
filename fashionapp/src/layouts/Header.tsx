import { Menu as MenuIcon , ShoppingCart , User, Search, CameraIcon, ChevronDown } from "lucide-react"
import { useMemo, useState } from "react"
import CartDrawer from "../components/CartDrawer"
import type { CartItem } from "../components/CartDrawer"
import product1 from "../assets/product1.jpg"
import product2 from "../assets/product2.jpg"
import product3 from "../assets/product3.jpg"
import { Link } from "react-router-dom"
import { Drawer, Dropdown} from "antd"
export default function Header() {
    const [openCart, setOpenCart] = useState(false)
    const [openMenu, setOpenMenu] = useState(false)
    const [openCategories,setOpenCategories] = useState(false);
    const [cartItems] = useState<CartItem[]>([
      { id: 1, name: "Áo thun basic cotton", image: product1, price: 199000, discount: 10, quantity: 2, size: "M", color: "Trắng" },
      { id: 2, name: "Quần jeans slim fit", image: product2, price: 399000, quantity: 1, size: "32", color: "Xanh đậm" },
      { id: 3, name: "Áo khoác bomber", image: product3, price: 699000, discount: 15, quantity: 1, size: "L", color: "Đen" }
    ])
    const navLinks = [
      { name: "SẢN PHẨM", href: "#" },
      { name: "HÀNG MỚI VỀ", href: "#" },
      { name: "HÀNG BÁN CHẠY", href: "#" },
      { name: "SALE", href: "#" },
    ]
    const categories = [
      {
        key: '/collection/ao-thun',
        label: <Link to="/collection/ao-thun">Áo thun</Link>,
      },
      {
        key: '/collections/ao-khoac',
        label: <Link to="/collections/ao-khoac">Áo khoác</Link>,
      },
      {
        key: '/collections/vay',
        label: <Link to="/collections/vay">Váy</Link>,
      },
      {
        key: '/collections/quan',
        label: <Link to="/collections/quan">Quần</Link>,
      },
    ]
    const cartCount = useMemo(() => cartItems.reduce((n, it) => n + it.quantity, 0), [cartItems])
    return (
        <header className="w-full bg-white shadow sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1660px] flex items-center justify-between py-3">
        
        {/* Menu (mobile) */}
        <button onClick={() => setOpenMenu(true)} className="md:hidden">
          <MenuIcon className="w-6 h-6 text-gray-700 cursor-pointer" />
        </button>
        <Drawer className="md:hidden h-full" title={<span className="text-xl font-bold">Danh mục</span>} placement="left" open={openMenu} onClose={() => setOpenMenu(false)}>
          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col gap-6">
              {navLinks.map((link)=> (
                link.name === "SẢN PHẨM" ? (
                <>
                <div className="flex items-center justify-between gap-2">
                  <Link key={link.name} to={link.href} className="text-xl border-b-2 font-bold cursor-pointer border-transparent transition-colors">
                    {link.name}
                  </Link>
                  <ChevronDown onClick={() => setOpenCategories(!openCategories)} className={`w-5 h-5 text-black-500 font-semibold cursor-pointer transition ${openCategories ? 'rotate-180' : ''}`} />
                </div>
                {openCategories ? (
                  <div className="flex flex-col pl-6 gap-2 transition">
                    {categories.map(item => (
                      <div key={item.key} className="py-1 text-lg font-semibold">
                        {item.label}
                      </div>
                    ))}
                  </div>
                ) : null}
                </>
                ):(
                  <Link key={link.name} to={link.href} className="text-xl border-b-2 font-bold cursor-pointer border-transparent transition-colors">
                    {link.name}
                  </Link>
                )
              ))}
            </div>
            {/* Drawer Contact Section */}
            <div className="flex flex-col gap-2 px-2 pb-4 border-t border-gray-200">
              <div className="font-bold text-base mt-5 mb-1">BẠN CẦN HỖ TRỢ?</div>
              <div className="flex items-center gap-2 text-base">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3.09 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.13 1.11.37 2.18.7 3.22a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c1.04.33 2.11.57 3.22.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>0896670687</span>
              </div>
              <div className="flex items-center gap-2 text-base">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>
                <span>lyphuongkhai2003@gmail.com</span>
              </div>
            </div>
          </div>
        </Drawer>
        {/* Logo */}
        <Link  to="/" className="text-xl font-bold text-black-600">DELULU</Link>

        

        {/*nav*/}
        <nav className="hidden md:flex space-x-8 text-gray-700 font-medium 
                text-sm lg:text-base xl:text-lg">

        {/* mega dropdown*/}
          <div className="relative group">
            <span className="cursor-pointer border-b-2 border-transparent hover:border-black transition-colors">
              SẢN PHẨM
            </span>

            {/* Mega Menu */}
            <div className="absolute left-[-250px] top-full w-[1000px] bg-white shadow-lg rounded p-8 hidden group-hover:block z-50" style={{ width: "1200px" }}>
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-1">
                  <img src="/dress1.jpg" alt="Dress" className="rounded-lg object-cover" />
                </div>
                <div className="col-span-3 grid grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-bold mb-2">Váy Đầm</h3>
                    <ul className="space-y-10 text-sm">
                      <li><Link to="#">Váy Đầm Công Sở</Link></li>
                      <li><Link to="#">Váy Đầm Form A</Link></li>
                      <li><Link to="#">Váy Đầm Xòe</Link></li>
                      <li><Link to="#">Váy Đầm Dự Tiệc</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Áo</h3>
                    <ul className="space-y-10 text-sm">
                      <li><Link to="#">Áo Sơ Mi</Link></li>
                      <li><Link to="#">Áo Thun</Link></li>
                      <li><Link to="#">Áo Khoác</Link></li>
                      <li><Link to="#">Áo Len</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Quần</h3>
                    <ul className="space-y-10 text-sm">
                      <li><Link to="#">Quần Jean</Link></li>
                      <li><Link to="#">Quần Short</Link></li>
                      <li><Link to="#">Quần Tây</Link></li>
                      <li><Link to="#">Chân Váy</Link></li>
                    </ul>
                  </div>
                </div>
                <div className="col-span-1">
                  <img src="/dress2.jpg" alt="Dress" className="rounded-lg object-cover" />
                </div>
              </div>
            </div>
          </div>
          {navLinks.filter(l => l.name !== "SẢN PHẨM").map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="border-b-2 border-transparent hover:border-b-2 hover:border-black transition-colors"
            >
              {link.name}
            </Link>
          ))}
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