import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Category } from "../services/categoryService";
import { useId } from "react";
import { getImageUrl } from "../utils/imageHelper";

interface CategorySliderProps {
    categories: Category[];
    title?: string;
    subtitle?: string;
    slidesPerView?: {
        mobile?: number;
        tablet?: number;
        desktop?: number;
    };
    spaceBetween?: number;
    loading?: boolean;
}

const CategorySlider: React.FC<CategorySliderProps> = ({
    categories,
    title,
    subtitle,
    slidesPerView = {
        mobile: 3,
        tablet: 4,
        desktop: 6
    },
    spaceBetween = 16,
    loading = false
}) => {
    const uniqueId = useId().replace(/:/g, '-');

    if (loading) {
        return (
            <section className="container mx-auto px-4">
                {title && (
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold mb-4 text-center text-gray-900">
                            {title}
                        </h2>
                        {subtitle && (
                            <h3 className="text-sm text-gray-500 mb-5 text-center">
                                {subtitle}
                            </h3>
                        )}
                    </div>
                )}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                            <div className="h-4 bg-gray-200 rounded mx-2 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded mx-2 w-3/4"></div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (!categories || categories.length === 0) {
        return null;
    }

    return (
        <section className="container mx-auto px-4">
            {/* Header */}
            {title && (
                <div className="text-center mb-4">
                    <h2 className="text-xl font-bold mb-4 text-center text-gray-900">
                        {title}
                    </h2>
                    {subtitle && (
                        <h3 className="text-sm text-gray-500 mb-5 text-center">
                            {subtitle}
                        </h3>
                    )}
                </div>
            )}

            {/* Swiper Slider */}
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
                    {categories.map((category) => (
                        <SwiperSlide key={category.category_id} className="flex-shrink-0">
                            <Link
                                to={`/collection/${category.slug}`}
                                className="group block"
                            >
                                <div className="relative overflow-hidden rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
                                    {/* Image Container */}
                                    <div className="aspect-square relative overflow-hidden bg-gray-50">
                                        {category.image_url ? (
                                            <img
                                                src={getImageUrl(category.image_url)}
                                                alt={category.category_name}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    console.error('Failed to load image:', getImageUrl(category.image_url));
                                                    console.error('Original path:', category.image_url);
                                                }}
                                                onLoad={() => {
                                                    console.log('Image loaded successfully:', getImageUrl(category.image_url));
                                                }}
                                            />
                                        ) : (

                                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
                                                        <span className="text-gray-500 text-lg font-bold">
                                                            {category.category_name.charAt(0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Hover Overlay - tạo hiệu ứng tối nhẹ khi hover */}
                                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                                    </div>

                                    {/* Category Info */}
                                    <div className="p-3 text-center">
                                        <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                                            {category.category_name}
                                        </h3>
                                        {category.description && (
                                            <p className="text-xs text-gray-500 truncate">
                                                {category.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {categories.length > (slidesPerView.mobile || 3) && (
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
        </section>
    );
};

export default CategorySlider;