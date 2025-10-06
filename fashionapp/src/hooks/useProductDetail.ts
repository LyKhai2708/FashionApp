import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from '../contexts/AuthContext';
import type { ProductDetail, ProductVariant } from '../types/product';

interface UseProductDetailReturn {
    product: ProductDetail | null;
    loading: boolean;
    error: string | null;
    selectedColor: ProductVariant['color'] | null;
    selectedSize: ProductVariant['size'] | null;
    selectedVariant: ProductVariant | null;
    availableSizes: ProductVariant['size'][];
    currentPrice: number;
    stockQuantity: number;
    setSelectedColor: (color: ProductVariant['color']) => void;
    setSelectedSize: (size: ProductVariant['size']) => void;
    toggleFavorite: () => Promise<void>;
    favoriteLoading: boolean;
}

export function useProductDetail(productId: number): UseProductDetailReturn {
    const { user } = useAuth();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [selectedColor, setSelectedColor] = useState<ProductVariant['color'] | null>(null);
    const [selectedSize, setSelectedSize] = useState<ProductVariant['size'] | null>(null);


    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);
                
                
                const productData = await productService.getProductById(productId, user?.id);

                setProduct(productData);
                

                if (productData.variants.length > 0) {
                    const firstColor = productData.variants[0].color;
                    setSelectedColor(firstColor);
                }
                
            } catch (err: any) {
                setError(err.message);
                console.error('Fetch product detail error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId, user?.id]);

    useEffect(() => {
        if (selectedColor && product) {
            const sizesForColor = product.variants
                .filter(v => v.color.color_id === selectedColor.color_id && v.active === 1)
                .map(v => v.size);
            
            if (sizesForColor.length > 0) {
                setSelectedSize(sizesForColor[0]);
            } else {
                setSelectedSize(null);
            }
        }
    }, [selectedColor, product]);

    // Get available sizes for selected color
    const availableSizes = product && selectedColor 
        ? product.variants
            .filter(v => v.color.color_id === selectedColor.color_id && v.active === 1)
            .map(v => v.size)
        : [];


    const selectedVariant = product && selectedColor && selectedSize
        ? product.variants.find(v => 
            v.color.color_id === selectedColor.color_id && 
            v.size.size_id === selectedSize.size_id
        ) || null
        : null;


    const currentPrice = selectedVariant?.final_price || product?.base_price || 0;
    const stockQuantity = selectedVariant?.stock_quantity || 0;

    // Toggle favorite
    const toggleFavorite = async () => {
        if (!user || !product) {
            alert('Vui lòng đăng nhập để thêm sản phẩm yêu thích');
            return;
        }

        try {
            setFavoriteLoading(true);
            
            console.log('Toggle favorite called:', {
                product_id: product.product_id,
                current_is_favorite: product.is_favorite,
                current_favorite_id: product.favorite_id,
                will_remove: product.is_favorite
            });
            
            const result = await favoriteService.toggleFavorite(
                product.product_id,
                product.is_favorite ? product.favorite_id : undefined
            );
            
            console.log('Toggle favorite result:', result);
            
            // Update local state with correct favorite_id
            setProduct(prev => prev ? {
                ...prev,
                is_favorite: result.isLiked,
                favorite_id: result.favoriteId || undefined
            } : null);
            
        } catch (error: any) {
            console.error('Toggle favorite error:', error);
            alert(error.message || 'Có lỗi xảy ra');
        } finally {
            setFavoriteLoading(false);
        }
    };

    return {
        product,
        loading,
        error,
        selectedColor,
        selectedSize,
        selectedVariant,
        availableSizes,
        currentPrice,
        stockQuantity,
        setSelectedColor,
        setSelectedSize,
        toggleFavorite,
        favoriteLoading
    };
}
