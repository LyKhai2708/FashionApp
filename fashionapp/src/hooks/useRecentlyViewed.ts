import { useState, useEffect, useCallback } from 'react';
import { recentlyViewedStorage } from '../utils/storage';
import productService from '../services/productService';
import type { Product } from '../types/product';

export const useRecentlyViewed = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const loadProducts = useCallback(async () => {
        const ids = recentlyViewedStorage.getIds();
        
        if (ids.length === 0) {
            setProducts([]);
            return;
        }

        setLoading(true);
        try {
            const fetchedProducts = await productService.getProductsByIds(ids);
            setProducts(fetchedProducts);
        } catch (error) {
            console.error('Error loading recently viewed products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'recently_viewed') {
                loadProducts();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadProducts]);

    const addProduct = useCallback((productId: number) => {
        recentlyViewedStorage.add(productId);
        loadProducts(); // Reload to get fresh data
    }, [loadProducts]);

    const removeProduct = useCallback((productId: number) => {
        recentlyViewedStorage.remove(productId);
        loadProducts();
    }, [loadProducts]);

    const clearAll = useCallback(() => {
        recentlyViewedStorage.clear();
        setProducts([]);
    }, []);

    return {
        products,
        loading,
        addProduct,
        removeProduct,
        clearAll,
        count: products.length
    };
};
