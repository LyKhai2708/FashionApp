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
                    title="PRODUCT CATEGORIES"
                    subtitle="Explore by specific product lines"
                />
            </section>
            <PromotionTabsSection />
            <section className="mt-20">
                <h2 className="text-xl font-bold mb-4 text-center">FEATURED PRODUCTS</h2>
                <h3 className="text-sm text-gray-500 mb-5 text-center">Most loved products</h3>
                <ProductSlider products={mostSoldProducts} loading={mostSoldLoading} />
            </section>

            <section className="mt-20">
                <h2 className="text-xl font-bold mb-4 text-center">NEW ARRIVALS</h2>
                <h3 className="text-sm text-gray-500 mb-5 text-center">Don't miss out on the latest products</h3>
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