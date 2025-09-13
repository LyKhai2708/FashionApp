
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import aaaa from '../assets/aaaa.jpg';

interface Product {
    id: number;
    image: string;
    name: string;
    price: number;
    discount?: number;
    sold?: number;
}

const ProductSlider = () => {
  const products: Product[] = [
    { id: 1, name: "Áo Thun Basic", price: 199000, image: aaaa, discount: 20, sold: 150 },
    { id: 2, name: "Áo Polo Trơn", price: 249000, image: aaaa, discount: 15, sold: 89 },
    { id: 3, name: "Áo Hoodie Đen", price: 399000, image: aaaa, discount: 10, sold: 234 },
    { id: 4, name: "Áo Sơ Mi Trắng", price: 299000, image: aaaa, sold: 567 },
    { id: 5, name: "Quần Jean Slim", price: 499000, image: aaaa, discount: 25, sold: 123 },
    { id: 6, name: "Áo Khoác Denim", price: 599000, image: aaaa, discount: 30, sold: 78 },
  ];

  return (
    <div className="overflow-hidden relative">
      <Swiper
        modules={[Navigation]}
        spaceBetween={16}
        slidesPerView={2}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        allowTouchMove={true}
        centeredSlides={false}
        roundLengths={true}
        touchRatio={1}
        threshold={5}
        resistanceRatio={0.85}
        watchSlidesProgress={true}
        breakpoints={{
          640: { slidesPerView: 3 }, // Tablet nhỏ
          768: { slidesPerView: 4 }, // Tablet lớn
          1024: { slidesPerView: 5 }, // Desktop
        }}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Custom Navigation Buttons */}
      <button className="cursor-pointer swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group">
        <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
      </button>
      
      <button className="cursor-pointer swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group">
        <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
      </button>
    </div>
  );
};

export default ProductSlider;
