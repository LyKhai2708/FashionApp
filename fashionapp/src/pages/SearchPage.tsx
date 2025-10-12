import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductListLayout from '../components/ProductListLayout';
import { useSearchProducts } from '../hooks/useProductList';

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    const { products, totalCount, loading, loadingMore, hasMore, loadMore } = useSearchProducts(searchTerm);

    useEffect(() => {
        const query = searchParams.get('q') || '';
        setSearchTerm(query);
        setSearchParams({ q: query });
    }, [searchParams]);

    const breadcrumbs = [
        { label: 'Sản phẩm', href: '/products' },
        { label: `Tìm kiếm: "${searchTerm}"`, href: `/search?q=${encodeURIComponent(searchTerm)}` }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <ProductListLayout
                products={products}
                loading={loading}
                totalCount={totalCount}
                title={`Kết quả tìm kiếm cho "${searchTerm}"`}
                breadcrumbs={breadcrumbs}
                onFilterChange={null}
                onSortChange={null} 
                onLoadMore={loadMore}
                hasMore={hasMore}
                loadingMore={loadingMore}
                currentFilters={{ limit: 8, search: searchTerm }}
            />
        </div>
    );
}