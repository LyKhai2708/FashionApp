import { Menu , ShoppingCart , User, Search, CameraIcon } from "lucide-react"

export default function Header() {
    const cartCount = 0
    return (
        <header className="w-full bg-white shadow sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        
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
            <div className="relative">
              <ShoppingCart className="w-6 h-6 cursor-pointer text-gray-700 hover:text-blue-600" />
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs leading-5 text-center select-none">
                {cartCount}
              </span>
            </div>
            <User className="w-6 h-6 cursor-pointer text-gray-700 hover:text-blue-600" />
          </div>
        </div>
        {/* Search */}
        
      </div>
    </header>
    )
}