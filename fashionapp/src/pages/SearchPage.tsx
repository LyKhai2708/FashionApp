import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductListLayout from '../components/ProductListLayout';
import { useSearchProducts } from '../hooks/useProductList';

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const searchTerm = searchParams.get('q') || '';

    const { products, totalCount, loading, setFilters } = useSearchProducts(searchTerm);

    useEffect(() => {
        if (searchTerm) {
            setFilters({ search: searchTerm });
        }
    }, [searchTerm, setFilters]);

    const breadcrumbs = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: `Search: "${searchTerm}"`, href: `/search?q=${encodeURIComponent(searchTerm)}` }
    ];

    return (
        <div className="container mx-auto px-4 ">
            <ProductListLayout
                products={products}
                loading={loading}
                totalCount={totalCount}
                title={`Search results for "${searchTerm}"`}
                breadcrumbs={breadcrumbs}
                currentFilters={{ limit: 8, search: searchTerm }}
            />
        </div>
    );
}