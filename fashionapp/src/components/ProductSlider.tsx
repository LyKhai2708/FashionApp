
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import aaaa from '../assets/product1.jpg';
import type { Product } from "../types/product";

const ProductSlider = () => {
  const products: Product[] = [
    {
      product_id: 1,
      name: "Áo Thun Basic", 
      description: "Áo thun basic chất liệu cotton",
      slug: "ao-thun-basic",
      base_price: 199000, 
      thumbnail: aaaa, 
      brand_id: 1,
      category_id: 1,
      created_at: new Date().toISOString(),
      discount_percent: 20,
      discounted_price: 159200,
      has_promotion: true,
      is_favorite: false,
      brand_name: "Local Brand",
      category_name: "Áo thun",
      colors: [],
      price_info: {
        base_price: 199000,
        discounted_price: 159200,
        discount_percent: 20,
        has_promotion: true
      }
    },
    {
      product_id: 2,
      name: "Áo Polo Trơn", 
      description: "Áo polo trơn thanh lịch",
      slug: "ao-polo-tron",
      base_price: 249000, 
      thumbnail: aaaa, 
      brand_id: 1,
      category_id: 1,
      created_at: new Date().toISOString(),
      discount_percent: 15,
      discounted_price: 211650,
      has_promotion: true,
      is_favorite: false,
      brand_name: "Local Brand",
      category_name: "Áo polo",
      colors: [],
      price_info: {
        base_price: 249000,
        discounted_price: 211650,
        discount_percent: 15,
        has_promotion: true
      }
    },
    {
      product_id: 3,
      name: "Áo Hoodie Đen", 
      description: "Áo hoodie màu đen thời trang",
      slug: "ao-hoodie-den",
      base_price: 399000, 
      thumbnail: aaaa, 
      brand_id: 1,
      category_id: 1,
      created_at: new Date().toISOString(),
      discount_percent: 10,
      discounted_price: 359100,
      has_promotion: true,
      is_favorite: false,
      brand_name: "Local Brand",
      category_name: "Áo hoodie",
      colors: [],
      price_info: {
        base_price: 399000,
        discounted_price: 359100,
        discount_percent: 10,
        has_promotion: true
      }
    },
    {
      product_id: 4,
      name: "Áo Sơ Mi Trắng", 
      description: "Áo sơ mi trắng công sở",
      slug: "ao-so-mi-trang",
      base_price: 299000, 
      thumbnail: aaaa, 
      brand_id: 1,
      category_id: 1,
      created_at: new Date().toISOString(),
      discount_percent: 0,
      discounted_price: 299000,
      has_promotion: false,
      is_favorite: false,
      brand_name: "Local Brand",
      category_name: "Áo sơ mi",
      colors: [],
      price_info: {
        base_price: 299000,
        discounted_price: 299000,
        discount_percent: 0,
        has_promotion: false
      }
    },
    {
      product_id: 5,
      name: "Quần Jean Slim", 
      description: "Quần jean slim fit",
      slug: "quan-jean-slim",
      base_price: 499000, 
      thumbnail: aaaa, 
      brand_id: 1,
      category_id: 2,
      created_at: new Date().toISOString(),
      discount_percent: 25,
      discounted_price: 374250,
      has_promotion: true,
      is_favorite: false,
      brand_name: "Local Brand",
      category_name: "Quần jean",
      colors: [],
      price_info: {
        base_price: 499000,
        discounted_price: 374250,
        discount_percent: 25,
        has_promotion: true
      }
    },
    {
      product_id: 6,
      name: "Áo Khoác Denim", 
      description: "Áo khoác denim thời trang",
      slug: "ao-khoac-denim",
      base_price: 599000, 
      thumbnail: aaaa, 
      brand_id: 1,
      category_id: 1,
      created_at: new Date().toISOString(),
      discount_percent: 30,
      discounted_price: 419300,
      has_promotion: true,
      is_favorite: false,
      brand_name: "Local Brand",
      category_name: "Áo khoác",
      colors: [],
      price_info: {
        base_price: 599000,
        discounted_price: 419300,
        discount_percent: 30,
        has_promotion: true
      }
    }
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
          640: { slidesPerView: 2 }, // Tablet nhỏ
          768: { slidesPerView: 3 }, // Tablet lớn
          1024: { slidesPerView: 4 }, // Desktop
        }}
      >
        {products.map((product) => (
          <SwiperSlide key={product.name} className="flex-shrink-0">
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
