import ProductCard from "./ProductCard"
import type { Product } from '../types/product';

interface ProductListProps {
    products?: Product[];
    loading?: boolean;
    limit?: number;
}

const ProductSkeleton = () => (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow animate-pulse">
        <div className="w-full aspect-[3/4] bg-gray-200"></div>
        <div className="p-4">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="flex gap-2 mt-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
        </div>
    </div>
);

export default function ProductList({ products = [], loading = false, limit }: ProductListProps) {
    if (loading) {
        const skeletonCount = limit || 8;
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: skeletonCount }).map((_, index) => (
                    <ProductSkeleton key={index} />
                ))}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium mb-2">Không có sản phẩm nào</h3>
                <p className="text-sm">Hãy thử tìm kiếm với từ khóa khác</p>
            </div>
        );
    }

    // Áp dụng limit nếu có
    const displayProducts = limit ? products.slice(0, limit) : products;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayProducts.map((product, index) => (
                <ProductCard 
                    key={`${product.product_id}-${index}`} 
                    product={product} 
                />
            ))}
        </div>
    );
}