import ProductSlider from "../components/ProductSlider"
import type { FC } from "react";
import ProductList from "../components/ProductList";
import HomeLayout from "../layouts/HomeLayout";
import CategorySlider from "../components/CategorySlider";

import { useFeaturedProducts, useMostSoldProducts } from "../hooks/useProductList";
import PromotionTabsSection from "../components/promotion/PromotionTabsSection";
import { categoryService } from "../services/categoryService";
import { useState, useEffect } from "react";
import type { Category } from "../services/categoryService";


const Home: FC = () => {
    const {
        products: featuredProducts,
        loading: featuredLoading
    } = useFeaturedProducts(8);

    const {
        products: mostSoldProducts,
        loading: mostSoldLoading
    } = useMostSoldProducts(8);

    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const leafCategories = await categoryService.getLeafCategories();
                console.log('Home - Loaded categories:', leafCategories);
                setCategories(leafCategories);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // const handleCategoryClick = (category: CategoryItem) => {
    //     navigate(`/collection/${category.slug}`);
    // };

    return (
        <HomeLayout>
            <section className="mt-20">
                <CategorySlider
                    categories={categories}
                    loading={categoriesLoading}
                    title="DANH MỤC SẢN PHẨM"
                    subtitle="Khám phá theo từng dòng sản phẩm cụ thể"
                />
            </section>
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