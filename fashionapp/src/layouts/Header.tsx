import { Menu as MenuIcon , ShoppingCart , User, ChevronDown } from "lucide-react"
import {useState, useEffect } from "react"
import CartDrawer from "../components/CartDrawer"
// import type { CartItem } from "../services/cartService"
// import product1 from "../assets/product1.jpg"
// import product2 from "../assets/product2.jpg"
// import product3 from "../assets/product3.jpg"
import { Link } from "react-router-dom"
import { Drawer, Dropdown} from "antd"
import type {MenuProps} from "antd"
import { authService } from "../services/authService"
import { useAuth } from "../contexts/AuthContext"
import { useMessage } from "../App"
import { useNavigate } from "react-router-dom"
import { categoryService } from "../services/categoryService"
import { useCart } from '../contexts/CartContext';
import SearchBar from "../components/SearchBar"
interface Category {
    category_id: number;
    category_name: string;
    slug: string;
    description?: string;
}

const UserDropDown = () => {
  const {logout} = useAuth()
  const message = useMessage()
  const navigate = useNavigate()  
  
  const handleLogout = async () => {
    try{
      await logout();
      message.success('Đăng xuất thành công')
      navigate('/');
    }catch(error){
      console.log(error);
      message.error('Đăng xuất thất bại')
    }
  }
    
  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <Link to="/profile" className="flex items-center space-x-2 px-2 py-1">
          <User className="w-4 h-4" />
          <span>Profile</span>
        </Link>
      ),
    },
    {
      key: 'favorites',
      label: (
        <Link to="/favorites" className="flex items-center space-x-2 px-2 py-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>Yêu thích</span>
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <div onClick={handleLogout} className="flex items-center space-x-2 px-2 py-1 cursor-pointer text-red-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Đăng xuất</span>
        </div>
      ),
    },
  ]

  return (
    <Dropdown 
     menu={{items: menuItems}}
     placement="bottomRight"
     trigger={['click']}
     >
      <User />
    </Dropdown>
  )
}
export default function Header() {
    const [openCart, setOpenCart] = useState(false)
    const [openMenu, setOpenMenu] = useState(false)
    const [openCategories,setOpenCategories] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    
    const navLinks = [
      { name: "SẢN PHẨM", href: "/products" },
      { name: "HÀNG MỚI VỀ", href: "/products?sort=newest" },
      { name: "HÀNG BÁN CHẠY", href: "/products" },
      { name: "SALE", href: "/products?promotion=true" },
    ]

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryService.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);
    const { totalItems } = useCart();
    return (
        <header className="w-full bg-white shadow sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1320px] flex items-stretch justify-between h-16">
        
        {/* Menu (mobile) */}
        <button onClick={() => setOpenMenu(true)} className="lg:hidden">
          <MenuIcon className="w-6 h-6 text-gray-700 cursor-pointer" />
        </button>
        <Drawer className="lg:hidden h-full" title={<span className="text-xl font-bold">Danh mục</span>} placement="left" open={openMenu} onClose={() => setOpenMenu(false)}>
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
                    {categories.map(category => (
                      <div key={category.category_id} className="py-1 text-lg font-semibold">
                        <Link to={`/collection/${category.slug}`}>
                          {category.category_name}
                        </Link>
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
        <Link  to="/" className="text-xl font-bold text-black-600 flex items-center">DELULU</Link>

        

        {/*nav*/}
        <nav className="hidden lg:flex items-stretch space-x-5 text-gray-700 font-medium text-xs h-full">

        {/* mega dropdown*/}
          <div className="relative group flex items-center">
            <span className="cursor-pointer flex items-center h-full relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[4px] after:bg-black after:transition-all after:duration-300 hover:after:w-full">
              SẢN PHẨM
            </span>

            {/* Mega Menu */}
            <div className="absolute left-[-250px] top-full w-[1000px] bg-white shadow-lg rounded rounded-t-none p-8 hidden group-hover:block z-50" style={{ width: "1200px" }}>
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-1">
                  <img src="/dress1.jpg" alt="Categories" className="rounded-lg object-cover" />
                </div>
                <div className="col-span-3">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <ul className="space-y-3 text-sm">
                        <li>
                          <Link 
                            to="/products" 
                            className="text-gray-700 hover:text-black transition-colors"
                          >
                            Tất cả sản phẩm
                          </Link>
                        </li>
                        {categories.slice(0, Math.ceil(categories.length / 2)).map(category => (
                          <li key={category.category_id}>
                            <Link 
                              to={`/collection/${category.slug}`}
                              className="text-gray-700 hover:text-black transition-colors"
                            >
                              {category.category_name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold mb-4 text-lg opacity-0">.</h3>
                      <ul className="space-y-3 text-sm">
                        {categories.slice(Math.ceil(categories.length / 2)).map(category => (
                          <li key={category.category_id}>
                            <Link 
                              to={`/collection/${category.slug}`}
                              className="text-gray-700 hover:text-black transition-colors"
                            >
                              {category.category_name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-span-1">
                  <img src="/dress2.jpg" alt="Categories" className="rounded-lg object-cover" />
                </div>
              </div>
            </div>
          </div>
          {navLinks.filter(l => l.name !== "SẢN PHẨM").map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="flex items-center h-full relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[4px] after:bg-black after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-4">
          {/* <div className="flex item-center space-x-2 border-b-2 border-gray-300">
            <Search className="w-5 h-10 text-gray-700 cursor-pointer" />
            <input type="text" placeholder="Tìm kiếm" className="rounded-md focus:outline-none" />
            <CameraIcon className="w-5 h-10 text-gray-700 cursor-pointer hover:text-blue-600" />
          </div> */}

          <SearchBar /> 
          {/* Action icons */}
          <div className="flex items-center space-x-4">
            <div className="relative" onClick={() => setOpenCart(true)}>
              <ShoppingCart className="w-6 h-6 cursor-pointer text-gray-700 hover:text-blue-600" />
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs leading-5 text-center select-none">
                {totalItems}
              </span>
            </div>
            {!authService.isAuthenticated() ? (
              <Link to={"/login"}><User className="w-6 h-6 cursor-pointer text-gray-700 hover:text-blue-600" /></Link>
            ) : (
              <UserDropDown />
            )}
          </div>
        </div>
        {/* Search */}
        
      </div>
      <CartDrawer open={openCart} onClose={() => setOpenCart(false)}/>
    </header>
    )
}