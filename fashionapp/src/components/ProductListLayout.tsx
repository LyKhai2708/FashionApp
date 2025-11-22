import { Pagination } from "antd";
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
    onPageChange?: (page: number) => void;
    currentPage?: number;
    pageSize?: number;
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
    onPageChange,
    currentPage = 1,
    pageSize = 12,
    currentFilters
}: ProductListLayoutProps) {
    const handlePageChange = (page: number) => {
        onPageChange?.(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-6">
                <Breadcrumb items={breadcrumbs} />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
                    {onFilterChange && (
                        <aside className="lg:col-span-1">
                            <FilterBar
                                onFilterChange={onFilterChange}
                                currentFilters={currentFilters}
                            />
                        </aside>
                    )}

                    <main className={onFilterChange ? "lg:col-span-3" : "lg:col-span-4"}>
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                    {totalCount > 0 && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} products
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    {onSortChange && (
                                        <SortDropdown
                                            onSortChange={onSortChange}
                                            currentSort={currentFilters?.sort}
                                        />
                                    )}
                                </div>
                            </div>

                            <ProductList products={products} loading={loading} gridColumns={3} />

                            {totalCount > pageSize && !loading && (
                                <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
                                    <Pagination
                                        current={currentPage}
                                        total={totalCount}
                                        pageSize={pageSize}
                                        onChange={handlePageChange}
                                        showSizeChanger={false}
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} of ${total} products`
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}