import { useState, useEffect, useCallback } from 'react';
import { recentlyViewedStorage } from '../utils/storage';
import type { Product } from '../types/product';

export const useRecentlyViewed = () => {
    const [products, setProducts] = useState<Product[]>([]);


    useEffect(() => {
        const loadProducts = () => {
            const stored = recentlyViewedStorage.getProducts();
            setProducts(stored);
        };

        loadProducts();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'recently_viewed') {
                loadProducts();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const addProduct = useCallback((product: Product) => {
        recentlyViewedStorage.add(product);
        setProducts(recentlyViewedStorage.getProducts());
    }, []);

    const removeProduct = useCallback((productId: number) => {
        recentlyViewedStorage.remove(productId);
        setProducts(recentlyViewedStorage.getProducts());
    }, []);

    const clearAll = useCallback(() => {
        recentlyViewedStorage.clear();
        setProducts([]);
    }, []);

    return {
        products,
        addProduct,
        removeProduct,
        clearAll,
        count: products.length
    };
};
