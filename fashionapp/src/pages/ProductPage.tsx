import { useMemo } from "react";
import ProductListLayout from "../components/ProductListLayout";
import { useProductList } from "../hooks/useProductList";
import { useUrlFilters } from "../hooks/useUrlFilters";
import type { ProductsParams } from "../types/product";

export default function ProductPage() {
    const { getFiltersFromUrl, saveFiltersToUrl, clearUrlFilters } = useUrlFilters();
    
    const initialFilters = useMemo(() => {
        const urlFilters = getFiltersFromUrl();

        return {
            limit: 12,
            ...urlFilters
        };
    }, [getFiltersFromUrl]);
    
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
    } = useProductList({
        initialParams: initialFilters,
        autoFetch: true
    });

    const breadcrumbs = [
        { label: "Trang chủ", href: "/" },
        { label: "Sản phẩm", href: "/products" }
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
        const newFilters = { ...currentFilters, sort: sort as ProductsParams['sort'] };
        saveFiltersToUrl(newFilters);
        
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
            title="TẤT CẢ SẢN PHẨM"
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