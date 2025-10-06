import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import type { Product, ProductsParams } from '../types/product';

interface UseProductListOptions {
    initialParams?: ProductsParams;
    categoryId?: number;
    autoFetch?: boolean;
}

interface UseProductListReturn {
    products: Product[];
    totalCount: number;

    loading: boolean;
    loadingMore: boolean;

    hasMore: boolean;
    currentPage: number;

    error: string | null;

    fetchProducts: (params?: ProductsParams, reset?: boolean) => Promise<void>;
    loadMore: () => Promise<void>;
    refetch: () => Promise<void>;
    setFilters: (filters: ProductsParams) => void;
    setSort: (sort: string) => void;

    currentFilters: ProductsParams;
}

export const useProductList = (options: UseProductListOptions = {}): UseProductListReturn => {
    const { initialParams = {}, categoryId, autoFetch = true } = options;
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    
    
    const getFiltersFromURL = useCallback((): ProductsParams => {
        const filters: ProductsParams = {
            page: 1,
            limit: 12,
            ...initialParams,
            ...(categoryId && { category_id: categoryId })
        };
        
        if (searchParams.get('color_id')) {
            const colorIds = searchParams.get('color_id')!.split(',').map(Number);
            filters.color_id = colorIds.length === 1 ? colorIds[0] : colorIds;
        }
        if (searchParams.get('size_id')) {
            const sizeIds = searchParams.get('size_id')!.split(',').map(Number);
            filters.size_id = sizeIds.length === 1 ? sizeIds[0] : sizeIds;
        }
        if (searchParams.get('min_price')) {
            filters.min_price = Number(searchParams.get('min_price'));
        }
        if (searchParams.get('max_price')) {
            filters.max_price = Number(searchParams.get('max_price'));
        }
        if (searchParams.get('sort')) {
            filters.sort = searchParams.get('sort') as ProductsParams['sort'];
        }
        
        return filters;
    }, [searchParams, initialParams, categoryId]);
    
    const updateURL = useCallback((filters: ProductsParams) => {
        const newParams = new URLSearchParams();
        
        if (filters.color_id) {
            const colorIds = Array.isArray(filters.color_id) ? filters.color_id : [filters.color_id];
            newParams.set('color_id', colorIds.join(','));
        }
        if (filters.size_id) {
            const sizeIds = Array.isArray(filters.size_id) ? filters.size_id : [filters.size_id];
            newParams.set('size_id', sizeIds.join(','));
        }
        if (filters.min_price) {
            newParams.set('min_price', filters.min_price.toString());
        }
        if (filters.max_price) {
            newParams.set('max_price', filters.max_price.toString());
        }
        if (filters.sort && filters.sort !== 'newest') {
            newParams.set('sort', filters.sort);
        }
        
        setSearchParams(newParams, { replace: true });
    }, [setSearchParams]);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    const [currentFilters, setCurrentFilters] = useState<ProductsParams>(() => {
        return getFiltersFromURL();
    });

    const fetchProducts = useCallback(async (
        params: ProductsParams = {},
        reset: boolean = false
    ) => {
        try {
            const isFirstPage = reset || params.page === 1;
            
            if (isFirstPage) {
                setLoading(true);
                setError(null);
            } else {
                setLoadingMore(true);
            }

            const finalParams = {
                ...params,
                page: reset ? 1 : (params.page || params.page || 1)
            };

            const response = await productService.getProducts(
                finalParams,
                user?.id
            );

            const { products: newProducts, metadata } = response;

            if (reset || finalParams.page === 1) {
                setProducts(newProducts);
                setCurrentPage(1);
            } else {
                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.product_id));
                    const newUniqueProducts = newProducts.filter(p => !existingIds.has(p.product_id));
                    return [...prev, ...newUniqueProducts];
                });
            }

            setTotalCount(metadata.totalRecords);
            setCurrentPage(metadata.page);
            
            setHasMore(metadata.page < metadata.lastPage);


        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách sản phẩm');
            
            if (reset) {
                setProducts([]);
                setTotalCount(0);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [currentFilters, user?.id]);

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || loading) return;
        
        const nextPage = currentPage + 1;
        await fetchProducts({ ...currentFilters, page: nextPage }, false);
    }, [hasMore, loadingMore, loading, currentPage, currentFilters, fetchProducts]);

    const refetch = useCallback(async () => {
        await fetchProducts(currentFilters, true);
    }, [fetchProducts, currentFilters]);

    const setFilters = useCallback((filters: ProductsParams) => {
        const baseFilters = {
            page: 1,
            limit: currentFilters.limit || 12,
            ...(categoryId && { category_id: categoryId })
        };

        const newFilters = { ...baseFilters, ...filters };
        
        setCurrentFilters(newFilters);
        updateURL(newFilters);
        fetchProducts(newFilters, true);
    }, [currentFilters, fetchProducts, categoryId, updateURL]);

    const setSort = useCallback((sort: string) => {
        const newFilters = {
            ...currentFilters,
            sort: sort as ProductsParams['sort'],
            page: 1
        };
        
        setCurrentFilters(newFilters);
        updateURL(newFilters);
        fetchProducts(newFilters, true);
    }, [currentFilters, fetchProducts, updateURL]);

    useEffect(() => {
        if (autoFetch) {
            fetchProducts(currentFilters, true);
        }
    }, [categoryId, autoFetch]);

    
    useEffect(() => {
        if (categoryId !== undefined) {
            setCurrentFilters(prev => ({
                ...prev,
                category_id: categoryId,
                page: 1
            }));
        }
    }, [categoryId]);

    useEffect(() => {
        if (autoFetch) {
            fetchProducts(currentFilters, true);
        }
    }, [user?.id]);

    return {
        products,
        totalCount,
        loading,
        loadingMore,
        hasMore,
        currentPage,
        error,
        fetchProducts,
        loadMore,
        refetch,
        setFilters,
        setSort,
        currentFilters
    };
};

export const useProductsByCategory = (categoryId: number) => {
    return useProductList({
        initialParams: { category_id: categoryId },
        categoryId,
        autoFetch: true
    });
};

export const useAllProducts = (categorySlug?: string) => {
    return useProductList({
        initialParams: { 
            limit: 12,
            ...(categorySlug && { category_slug: categorySlug })
        },
        autoFetch: true
    });
};

export const useFeaturedProducts = (limit: number = 8) => {
    return useProductList({
        initialParams: { limit, sort: 'newest' },
        autoFetch: true
    });
};

export const useSearchProducts = (searchTerm: string) => {
    return useProductList({
        initialParams: { search: searchTerm, limit: 12 },
        autoFetch: !!searchTerm
    });
};
