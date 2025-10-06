import React from "react";
import { useParams } from "react-router-dom";
import ProductListLayout from "../components/ProductListLayout";
import { useAllProducts } from "../hooks/useProductList";
import type { ProductsParams } from "../types/product";
import CategoryService, { type Category }  from "../services/categoryService";
import { useEffect } from "react";
export default function ProductPage() {
    const [category, setCategory] = React.useState<{
        category_id: number;
        category_name: string;
        slug: string;
        parent_id: number | null;
        active: number;
        children: Category[];
    } | null>(null);
    const { categorySlug } = useParams<{ categorySlug?: string }>();
    const {
        products,
        loading,
        totalCount,
        setFilters,
        setSort,
        loadMore,
        hasMore,
        loadingMore,
        currentFilters,
        error
    } = useAllProducts(categorySlug);

    useEffect(() => {
    const fetchCategory = async () => {
        if (categorySlug) {
            const result = await CategoryService.getCategoryBySlug(categorySlug);
            if (result) {
                setCategory({
                    category_id: result.category_id,
                    category_name: result.category_name,
                    slug: result.slug,
                    parent_id: result.parent_id ?? null,
                    active: result.active,
                    children: result.children ?? [],
                });
            } else {
                setCategory(null);
            }
        } else {
            setCategory(null);
        }
    };
    fetchCategory();
    }, [categorySlug]);
    const getPageTitle = () => {
        if (categorySlug) {
            return category ? category.category_name : "Sản phẩm";
        }
        return "TẤT CẢ SẢN PHẨM";
    };

    const breadcrumbs = categorySlug ? [
        { label: "Trang chủ", href: "/" },
        { label: "Sản phẩm", href: "/products" },
        { label: getPageTitle(), href: `/collection/${categorySlug}` }
    ] : [
        { label: "Trang chủ", href: "/" },
        { label: "Sản phẩm", href: "/products" }
    ];

    const handleFilterChange = (filters: ProductsParams) => {
        console.log('🔧 Applying filters:', filters);
        setFilters(filters);
    };

    const handleSortChange = (sort: string) => {
        console.log('📊 Applying sort:', sort);
        setSort(sort);
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">😞</div>
                    <h2 className="text-xl font-semibold mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ProductListLayout
            products={products}
            loading={loading}
            totalCount={totalCount}
            title={getPageTitle()}
            breadcrumbs={breadcrumbs}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            currentFilters={currentFilters}
        />
    );
}