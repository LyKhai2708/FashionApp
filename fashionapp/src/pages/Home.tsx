import ProductSlider from "../components/ProductSlider"
import type { FC } from "react";
import ProductList from "../components/ProductList";
import HomeLayout from "../layouts/HomeLayout";

import { useFeaturedProducts, useMostSoldProducts } from "../hooks/useProductList";
import PromotionTabsSection from "../components/promotion/PromotionTabsSection";


const Home: FC = () => {
    const { 
        products: featuredProducts, 
        loading: featuredLoading 
    } = useFeaturedProducts(8);

    const {
        products: mostSoldProducts,
        loading: mostSoldLoading
    } = useMostSoldProducts(8);

    // const handleCategoryClick = (category: CategoryItem) => {
    //     navigate(`/collection/${category.slug}`);
    // };

    return (
        <HomeLayout>
            {/* Category Section */}
            {/* <section className="mx-auto max-w-6xl p-4 flex flex-col items-center">
                <h2 className="font-bold text-2xl">DANH MỤC SẢN PHẨM</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                    {categories.map((category) => (
                        <button 
                            key={category.id} 
                            className="cursor-pointer" 
                            onClick={() => handleCategoryClick(category)}
                        >
                            <div className="flex flex-col items-center p-10 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                                {category.icon}
                                <span className="mt-2 text-md font-medium">{category.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </section> */}
            <PromotionTabsSection />
            <section className="mt-20">
                <h2 className="text-xl font-bold mb-4 text-center">SẢN PHẨM NỔI BẬT</h2>
                <h3 className="text-sm text-gray-500 mb-5 text-center">Những sản phẩm được yêu thích nhất</h3>
                <ProductSlider products={mostSoldProducts} loading={mostSoldLoading} />
            </section>

            <section className="mt-20">
                <h2 className="text-xl font-bold mb-4 text-center">HÀNG MỚI VỀ</h2>
                <h3 className="text-sm text-gray-500 mb-5 text-center">Đừng bỏ lỡ những sản phẩm mới nhất</h3>
                <ProductList 
                    products={featuredProducts} 
                    loading={featuredLoading}
                    limit={8}
                />
            </section>
        </HomeLayout>
    )
}

export default Home