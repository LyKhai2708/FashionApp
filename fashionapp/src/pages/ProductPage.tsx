import { useSearchParams } from "react-router-dom";
import ProductListLayout from "../components/ProductListLayout";
import { useProductList } from "../hooks/useProductList";
import type { ProductsParams } from "../types/product";
import { useMemo } from "react";

export default function ProductPage() {
    const [searchParams] = useSearchParams();
    
    // Get filters from URL query params
    const initialFilters = useMemo(() => {
        const filters: ProductsParams = { limit: 12 };
        
        if (searchParams.get('promotion_id')) {
            filters.promotion_id = Number(searchParams.get('promotion_id'));
        }
        if (searchParams.get('brand_id')) {
            filters.brand_id = Number(searchParams.get('brand_id'));
        }
        if (searchParams.get('on_sale')) {
            filters.on_sale = searchParams.get('on_sale') === 'true';
        }
        if (searchParams.get('search')) {
            filters.search = searchParams.get('search')!;
        }
        
        return filters;
    }, [searchParams]);

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

    // Dynamic page title based on filters
    const getPageTitle = () => {
        if (searchParams.get('search')) {
            return `Kết quả tìm kiếm: "${searchParams.get('search')}"`;
        }
        if (searchParams.get('on_sale')) {
            return "SẢN PHẨM ĐANG GIẢM GIÁ";
        }
        if (searchParams.get('promotion_id')) {
            return "SẢN PHẨM KHUYẾN MÃI";
        }
        return "TẤT CẢ SẢN PHẨM";
    };

    const breadcrumbs = [
        { label: "Trang chủ", href: "/" },
        { label: "Sản phẩm", href: "/products" }
    ];

    const handleFilterChange = (filters: ProductsParams) => {
        setFilters(filters);
    };

    const handleSortChange = (sort: string) => {
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