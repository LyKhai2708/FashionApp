import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import ProductListLayout from "../components/ProductListLayout";
import { useProductList } from "../hooks/useProductList";
import { useUrlFilters } from "../hooks/useUrlFilters";
import type { ProductsParams } from "../types/product";
import CategoryService, { type Category } from "../services/categoryService";

export default function CategoryPage() {
    const { getFiltersFromUrl, saveFiltersToUrl, clearUrlFilters } = useUrlFilters();

    const [category, setCategory] = useState<{
        category_id: number;
        category_name: string;
        slug: string;
        parent_id: number | null;
        active: number;
        children: Category[];
    } | null>(null);

    const { categorySlug } = useParams<{ categorySlug: string }>();

    // Fetch category từ slug
    useEffect(() => {
        const fetchCategory = async () => {
            if (categorySlug) {
                try {
                    const result = await CategoryService.getCategoryBySlug(categorySlug);
                    if (result) {
                        console.log('✅ Category loaded:', result);
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
                } catch (error) {
                    console.error('Error loading category:', error);
                }
            }
        };
        fetchCategory();
    }, [categorySlug]);

    const initialFilters = useMemo(() => {
        const urlFilters = getFiltersFromUrl();
        return {
            limit: 12,
            page: 1,
            ...urlFilters
        };
    }, [getFiltersFromUrl]);

    const {
        products,
        loading,
        totalCount,
        setFilters,
        setSort,
        currentFilters,
        error
    } = useProductList({
        initialParams: initialFilters,
        categoryId: category?.category_id,
        autoFetch: true
    });

    const breadcrumbs = [
        { label: "Trang chủ", href: "/" },
        { label: "Sản phẩm", href: "/products" },
        { label: category?.category_name || "Danh mục", href: `/collection/${categorySlug}` }
    ];

    const handleFilterChange = (filters: ProductsParams) => {

        if (Object.keys(filters).length === 0) {
            clearUrlFilters();
        } else {
            saveFiltersToUrl(filters);
        }

        setFilters(filters);
    };

    const handleSortChange = (sort: string) => {

        const newFilters = { ...currentFilters, sort: sort as ProductsParams['sort'], page: 1 };
        saveFiltersToUrl(newFilters);

        setSort(sort);
    };

    const handlePageChange = (page: number) => {
        const newFilters = { ...currentFilters, page };
        saveFiltersToUrl(newFilters);
        setFilters(newFilters);
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
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

    // Show loading while fetching category
    if (!category && categorySlug) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải danh mục...</p>
                </div>
            </div>
        );
    }

    return (
        <ProductListLayout
            products={products}
            loading={loading}
            totalCount={totalCount}
            title={category?.category_name || "Danh mục"}
            breadcrumbs={breadcrumbs}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            onPageChange={handlePageChange}
            currentPage={currentFilters?.page || 1}
            pageSize={currentFilters?.limit || 12}
            currentFilters={currentFilters}
        />
    );
}