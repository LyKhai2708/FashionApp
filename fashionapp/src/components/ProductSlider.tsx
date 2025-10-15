import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "../types/product";
import { Empty } from "antd";
import { useId } from "react";

interface ProductSliderProps {
    products: Product[];
    title?: string;
    showTitle?: boolean;
    slidesPerView?: {
        mobile?: number;
        tablet?: number;
        desktop?: number;
    };
    spaceBetween?: number;
    loading?: boolean;
}

const ProductSlider: React.FC<ProductSliderProps> = ({ 
    products,
    title,
    showTitle = false,
    slidesPerView = {
        mobile: 2,
        tablet: 3,
        desktop: 4
    },
    spaceBetween = 16,
    loading = false
}) => {
    const uniqueId = useId().replace(/:/g, '-');
    // Loading skeleton
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 h-64 rounded-lg mb-2"></div>
                        <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                        <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium mb-2">Không có sản phẩm nào</h3>
            </div>
        );
    }

    return (
        <div>
            {showTitle && title && (
                <h3 className="text-xl font-bold mb-4">{title}</h3>
            )}
            
            <div className="overflow-hidden relative">
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={spaceBetween}
                    slidesPerView={slidesPerView.mobile}
                    navigation={{
                        nextEl: `.swiper-button-next-${uniqueId}`,
                        prevEl: `.swiper-button-prev-${uniqueId}`,
                    }}
                    allowTouchMove={true}
                    centeredSlides={false}
                    roundLengths={true}
                    touchRatio={1}
                    threshold={5}
                    resistanceRatio={0.85}
                    watchSlidesProgress={true}
                    breakpoints={{
                        640: { slidesPerView: slidesPerView.mobile }, 
                        768: { slidesPerView: slidesPerView.tablet }, 
                        1024: { slidesPerView: slidesPerView.desktop }, 
                    }}
                >
                    {products.map((product) => (
                        <SwiperSlide key={product.product_id} className="flex-shrink-0">
                            <ProductCard product={product} />
                        </SwiperSlide>
                    ))}
                </Swiper>
                
                {products.length > (slidesPerView.desktop || 4) && (
                    <>
                        <button className={`cursor-pointer swiper-button-prev-${uniqueId} absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group`}>
                            <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
                        </button>
                        
                        <button className={`cursor-pointer swiper-button-next-${uniqueId} absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group`}>
                            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" strokeWidth={2} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProductSlider;