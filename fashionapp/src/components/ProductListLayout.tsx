import { useRef, useEffect } from "react";
import ProductList from "./ProductList";
import Breadcrumb from "./Breadcrumb";
import FilterBar from "./FilterBar";
import SortDropdown from "./SortDropdown";
import type { Product, ProductsParams } from '../types/product';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface ProductListLayoutProps {
    products: Product[];
    loading?: boolean;
    totalCount?: number;
    title: string;
    breadcrumbs?: BreadcrumbItem[];
    onFilterChange?: (filters: ProductsParams) => void;
    onSortChange?: (sort: string) => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
    currentFilters?: ProductsParams;
}

export default function ProductListLayout({
    products,
    loading = false,
    totalCount = 0,
    title,
    breadcrumbs = [],
    onFilterChange,
    onSortChange,
    onLoadMore,
    hasMore = false,
    loadingMore = false,
    currentFilters
}: ProductListLayoutProps) {
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!onLoadMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    onLoadMore();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loadingMore, loading, onLoadMore]);

    // Scroll to top khi filter/sort thay đổi
    useEffect(() => {
        if (!loading) return;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [loading]);

    return (
        <div className="min-h-screen">
            {/* Breadcrumb */}
            <Breadcrumb items={breadcrumbs} />

            {/* Header with title and controls */}
            <div className="flex items-center justify-between mb-6">
                <div className="text-xl font-semibold">
                    {title} {totalCount > 0 ? <span>({totalCount} sản phẩm)</span> : null}
                </div>
                
                <div className="flex items-center justify-end gap-4 flex-wrap">
                    <FilterBar onFilterChange={onFilterChange} currentFilters={currentFilters} />
                    <SortDropdown onSortChange={onSortChange} currentSort={currentFilters?.sort} />
                </div>
            </div>

            {/* Product List */}
            <ProductList products={products} loading={loading} />

            {/* Loading More Indicator */}
            {loadingMore && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
                    <span className="ml-3 text-gray-600">Đang tải thêm...</span>
                </div>
            )}

            {/* Intersection Observer Target */}
            {hasMore && !loadingMore && (
                <div ref={observerTarget} className="h-20 flex justify-center items-center">
                    <span className="text-gray-400 text-sm">Cuộn xuống để xem thêm</span>
                </div>
            )}

            {/* End Message */}
            {!hasMore && products.length > 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                    Đã hiển thị tất cả {totalCount} sản phẩm
                </div>
            )}
        </div>
    );
}