import { useState, useEffect, useCallback, useRef } from 'react';
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
    
    // Refs để tránh stale closures
    const abortControllerRef = useRef<AbortController | null>(null);
    const hasInitialFetch = useRef(false);
    
    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    const [currentFilters, setCurrentFilters] = useState<ProductsParams>({
        page: 1,
        limit: 12,
        ...initialParams,
        ...(categoryId !== undefined && { category_id: categoryId })
    });


    useEffect(() => {
        return () => {

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);


    const fetchProducts = useCallback(async (
        params: ProductsParams = {},
        reset: boolean = false
    ) => {
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const isFirstPage = reset || params.page === 1;
            
            if (isFirstPage) {
                setLoading(true);
                setError(null);
            } else {
                setLoadingMore(true);
            }

            const finalParams = {
                ...params,
                page: reset ? 1 : (params.page || 1)
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
                    const uniqueNew = newProducts.filter(p => !existingIds.has(p.product_id));
                    return [...prev, ...uniqueNew];
                });
            }

            setTotalCount(metadata.totalRecords);
            setCurrentPage(metadata.page);
            setHasMore(metadata.page < metadata.lastPage);

            setLoading(false);
            setLoadingMore(false);

        } catch (err: any) {
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                return;
            }
            
            setError(err.message || 'Không thể tải danh sách sản phẩm');
            
            if (reset) {
                setProducts([]);
                setTotalCount(0);
            }
            
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user?.id]);

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || loading) {
            console.log('Cannot load more');
            return;
        }
        
        await fetchProducts({ ...currentFilters, page: currentPage + 1 }, false);
    }, [hasMore, loadingMore, loading, currentPage, currentFilters, fetchProducts]);

    const refetch = useCallback(async () => {

        await fetchProducts(currentFilters, true);
    }, [fetchProducts, currentFilters]);

    const setFilters = useCallback((filters: ProductsParams) => {
        const isClearing = Object.keys(filters).length === 0;

        let newFilters: ProductsParams;

        if (isClearing) {

            newFilters = {
                page: 1,
                limit: currentFilters.limit || 12,
                ...(categoryId !== undefined && { category_id: categoryId })
            };

        } else {
            newFilters = {
                page: 1,
                limit: currentFilters.limit || 12,
                ...(categoryId !== undefined && { category_id: categoryId }),
                ...filters
            };
            
            Object.keys(newFilters).forEach(key => {
                const value = newFilters[key as keyof ProductsParams];
                if (value === undefined || value === null || value === '') {
                    delete newFilters[key as keyof ProductsParams];
                }
            });
            

        }
        
        setCurrentFilters(newFilters);
        setHasMore(true);
        fetchProducts(newFilters, true);
    }, [categoryId, currentFilters.limit, fetchProducts]);

    const setSort = useCallback((sort: string) => {
        
        const newFilters = {
            ...currentFilters,
            sort: sort as ProductsParams['sort'],
            page: 1
        };
        
        setCurrentFilters(newFilters);
        setHasMore(true);
        fetchProducts(newFilters, true);
    }, [currentFilters, fetchProducts]);

    useEffect(() => {
        if (autoFetch && !hasInitialFetch.current) {
            hasInitialFetch.current = true;
            
            const initialFilters = {
                page: 1,
                limit: 12,
                ...initialParams,
                ...(categoryId !== undefined && { category_id: categoryId })
            };
            
            setCurrentFilters(initialFilters);
            fetchProducts(initialFilters, true);
        }
    }, [autoFetch, categoryId, initialParams, fetchProducts]);


    useEffect(() => {
        if (hasInitialFetch.current && categoryId !== undefined && categoryId !== currentFilters.category_id) {
            
            const newFilters = {
                page: 1,
                limit: currentFilters.limit || 12,
                category_id: categoryId
            };
            
            setCurrentFilters(newFilters);
            setHasMore(true);
            fetchProducts(newFilters, true);
        }
    }, [categoryId]);

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

export const useAllProducts = () => {
    return useProductList({
        initialParams: { limit: 12 },
        autoFetch: true
    });
};

export const useFeaturedProducts = (limit: number = 8) => {
    return useProductList({
        initialParams: { limit, sort: 'newest' },
        autoFetch: true
    });
};

export const useMostSoldProducts = (limit: number = 8) => {
    return useProductList({
        initialParams: { limit, sort: 'sold' },
        autoFetch: true
    });
};

export const useSearchProducts = (searchTerm: string) => {
    return useProductList({
        initialParams: { search: searchTerm, limit: 12 },
        autoFetch: !!searchTerm
    });
};

export const useRelatedProducts = (categoryId: number | undefined, limit: number = 8) => {
    return useProductList({
        initialParams: { category_id: categoryId, limit, sort: 'newest' },
        autoFetch: !!categoryId
    });
};