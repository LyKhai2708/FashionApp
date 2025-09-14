import aaaa from '../assets/aaaa.jpg'
import {Minus, Plus, Heart} from 'lucide-react'
import { useState } from 'react'
import ProductSlider from '../components/ProductSlider'
export default function ProductDetailPage() {
    const [activeTab, setActiveTab] = useState('description')
    const [isFavorite, setIsFavorite] = useState(false)
    const [quantity, setQuantity] = useState(1)
    const [chooseSize, setChooseSize] = useState('S');
    const [color, setColor] = useState('red');
    const PlusQuantity = () => {
        
        setQuantity(quantity + 1)
    }
    const MinusQuantity = () => {
        if(quantity > 1) {
            setQuantity(quantity - 1)
        }
    }
    const ChangeSize = (size: string) => {
        setChooseSize(size)
    }
    const ChangeColor = (color: string) => {
        setColor(color)
    }
    return (
        <>
        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Images Section */}
            <div>
                <img
                className='w-full rounded-lg shadow object-cover h-96'
                src={aaaa}
                alt='Giày'></img>
                <div className='flex gap-2 mt-4'>
                    <img src={aaaa} className='w-20 h-20 object-cover cursor-pointer border border-gray-200 rounded hover:border-black'/>
                    <img src={aaaa} className='w-20 h-20 object-cover cursor-pointer border border-gray-200 rounded hover:border-black'/>
                    <img src={aaaa} className='w-20 h-20 object-cover cursor-pointer border border-gray-200 rounded hover:border-black'/>
                </div>
            </div>
            {/* Product Details Section */}
            <div>
                <h3 className='text-2xl font-semibold'>Giày Thể Thao Biti's Helio Teen Nam Màu Nâu</h3>
                <div className='mt-2 flex gap-4 flex-wrap '>
                    <span className='text-sm text-gray-500'>Mã sản phẩm: <span className='text-black font-semibold'>BSB008100NAU</span></span>
                    <span className='text-sm text-gray-500'>Hàng tồn: <span className='text-black font-semibold'>300</span></span>
                    <span className='text-sm text-gray-500'>Thương hiệu: <span className='text-black font-semibold'>Gucci</span></span>
                </div>
                <div className='flex items-baseline gap-2 mt-4'>
                    <span className='text-lg font-semibold text-red-600'>300.000đ</span>
                    <span className='line-through text-gray-300'>399.600đ</span>
                    <div className='bg-red-500 text-white text-xs font-bold p-2 rounded'>-20%</div>
                </div>
                <div className='mt-6'>
                    <span className='font-semibold'>Màu sắc: </span>
                    <div className="flex gap-2 mt-2">
                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-[url('/images/stripe.png')] bg-cover cursor-pointer hover:border-black transition-colors"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-200 cursor-pointer hover:border-black transition-colors "></div>
                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-blue-500 cursor-pointer hover:border-black transition-colors"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-red-500 cursor-pointer hover:border-black transition-colors"></div>
                    </div>
                </div>
                {/* Size Selection */}
                <div className='mt-6'>
                    <span className='font-semibold'>Kích cỡ: </span>
                    <div className='flex gap-2'>
                        {["S", "M","L","XL"].map((size) => (
                            <button className={`cursor-pointer transition border w-10 h-10 ${size === chooseSize ? 'border-black ' : 'border-none'}`} onClick={() => ChangeSize(size)} key={size}>{size}</button>),)}
                    </div>
                </div>
                {/* Quantity Selector */}
                <div className='mt-6 flex items-center gap-4'>
                    <span className='font-semibold'>Số lượng: </span>
                    <div className='inline-flex items-center border border-gray-400 rounded mt-2 justify-between'>
                        <button className='cursor-pointer px-3 py-3  rounded-l hover:bg-black hover:text-white transition text-2xl' onClick={MinusQuantity}><Minus/></button>
                        <input type="number" defaultValue={1} min={1} value={quantity}  className='w-16 h-10 text-center text-lg font-semibold border-0 outline-none' style={{WebkitAppearance: 'none', MozAppearance: 'textfield'}}/>
                        <button className='cursor-pointer px-3 py-3  rounded-r hover:bg-black hover:text-white transition ' onClick={PlusQuantity}><Plus/></button>
                    </div>
                    
                </div>
                {/*Button*/}
                <div className='mt-8 flex flex-col md:flex-row gap-4'>
                    <button className='flex-1 py-3 text-white bg-black font-medium rounded cursor-pointer' >Thêm vào giỏ hàng</button> 
                    <button className='flex-1 bg-white rounded border font-medium py-3 cursor-pointer'>Mua Ngay</button>
                    <button 
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`p-3 rounded border font-medium cursor-pointer transition ${
                            isFavorite 
                                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>
                <div className='mt-8'>
                    <div className='flex border-b border-gray-300' >
                    <button className={`flex-1 text-start hover:bg-gray-300 py-3 cursor-pointer transition font-semibold border-b-2  ${activeTab === 'description' 
                                    ? 'border-black text-black bg-gray-50' 
                                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`} onClick={() => setActiveTab("description")}>MÔ TẢ SẢN PHẨM</button>
                        <button className={`flex-1 text-start hover:bg-gray-300 py-3 cursor-pointer transition font-semibold border-b-2 ${activeTab === 'instruction'
                                    ? 'border-black text-black bg-gray-50'
                                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}onClick={() => setActiveTab("instruction")} >HƯỚNG DẪN BẢO QUẢN</button>
                    </div>
                </div>
                <div className='mt-4 h-50'>
                    {activeTab === 'description' && (
                        <div>
                            <p className='text-gray-700 leading-relaxed'>
                                Giày Thể Thao Biti's Helio Teen Nam Màu Nâu là sự kết hợp hoàn hảo giữa phong cách thời trang và hiệu suất vượt trội. Với thiết kế hiện đại, đế giày được làm từ chất liệu cao su chống trơn trượt, mang lại sự an toàn và thoải mái khi di chuyển. Phần upper bằng vải lưới thoáng khí giúp đôi chân luôn khô ráo và thoáng mát trong suốt cả ngày dài. Đặc biệt, công nghệ đệm EVA tiên tiến giúp giảm chấn và tăng cường sự êm ái khi vận động. Giày Biti's Helio Teen không chỉ phù hợp cho các hoạt động thể thao mà còn là lựa chọn lý tưởng để phối đồ hàng ngày, tạo nên phong cách năng động và trẻ trung.
                            </p>
                        </div>
                    )}
                    {activeTab === 'instruction' && (
                        <div>
                            <ul className='list-disc list-inside text-gray-700 leading-relaxed'>
                                <li>Tránh tiếp xúc với nước trong thời gian dài để giữ độ bền của chất liệu.</li>
                                <li>Vệ sinh giày bằng khăn ẩm hoặc bàn chải mềm để loại bỏ bụi bẩn.</li>
                                <li>Không sử dụng chất tẩy rửa mạnh hoặc ngâm giày trong nước.</li>
                                <li>Để giày ở nơi khô ráo, thoáng mát và tránh ánh nắng trực tiếp.</li>
                                <li>Sử dụng giấy báo nhét vào bên trong giày khi không sử dụng để giữ form dáng.</li>
                            </ul>
                        </div>
                    )}
                </div>          
            </div>

        </div>
        
        {/* Related Products Slider */}
        <div className="mt-20">
            <h2 className="text-xl font-bold mb-4">Gợi ý dành cho bạn</h2>
            <ProductSlider />
        </div>
        {/* Sản phẩm liên quan */}
        <div className="mt-20">
            <h2 className="text-xl font-bold mb-4">Sản phẩm liên quan</h2>
            <ProductSlider />
        </div>
        </>
    );
}