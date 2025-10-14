import { HeartIcon, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product, ProductColor, ProductSize } from '../types/product';
import { formatVNDPrice } from '../utils/priceFormatter';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
    product: Product;
    compact?: boolean;
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(product.is_favorite || false);
    const [loading, setLoading] = useState(false);
    const [favoriteId, setFavoriteId] = useState(product.favorite_id);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
        product.colors && product.colors.length > 0 ? product.colors[0] : null
    );
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        setLiked(product.is_favorite || false);
        setFavoriteId(product.favorite_id);
    }, [product.is_favorite, product.favorite_id, user?.id]);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            alert('Vui lòng đăng nhập để thêm sản phẩm yêu thích');
            return;
        }

        if (loading) return;

        const previousLiked = liked;
        const previousFavoriteId = favoriteId;

        try {
            setLoading(true);
            
            const result = await favoriteService.toggleFavorite(
                product.product_id,
                liked ? favoriteId : undefined
            );
            
            setLiked(result.isLiked);
            setFavoriteId(result.favoriteId);

        } catch (error: any) {

            setLiked(previousLiked);
            setFavoriteId(previousFavoriteId);
            console.error('Toggle favorite error:', error);
            alert(error.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = () => {
        const slug = `${product.slug}-${product.product_id}`;
        navigate(`/products/${slug}`);
    };

    const handleQuickAddToCart = async (e: React.MouseEvent, size: ProductSize) => {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedColor) return;
        if (addingToCart) return;

        try {
            setAddingToCart(true);

            const payload = {
                product_variants_id: size.variant_id,
                quantity: 1
            };

            const productDetails = {
                product_id: product.product_id,
                product_name: product.name,
                slug: product.slug,
                thumbnail: selectedColor.images[0]?.image_url || product.thumbnail,
                price: product.discounted_price || product.base_price,
                variant: {
                    variant_id: size.variant_id,
                    stock_quantity: size.stock_quantity,
                    final_price: product.discounted_price || product.base_price,
                    active: 1,
                    color: {
                        color_id: selectedColor.color_id,
                        name: selectedColor.name,
                        hex_code: selectedColor.hex_code,
                        images: selectedColor.images
                    },
                    size: {
                        size_id: size.size_id,
                        name: size.size_name
                    }
                }
            };

            await addToCart(payload, productDetails);
        } catch (error) {
            console.error('Quick add to cart error:', error);
        } finally {
            setAddingToCart(false);
        }
    };

    const handleColorChange = (e: React.MouseEvent, color: ProductColor) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedColor(color);
    };
    
    const hasVariants = selectedColor && selectedColor.sizes && selectedColor.sizes.length > 0;

    return (
        <div 
            className={`cursor-pointer relative group flex flex-col border border-gray-200 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow duration-300 h-full group-hover:z-20 ${compact ? 'text-xs' : ''}`}
            onClick={handleCardClick}
            onMouseEnter={() => !compact && setShowQuickAdd(true)}
            onMouseLeave={() => !compact && setShowQuickAdd(false)}
        >
            <div className="relative">
                <img 
                    src={selectedColor?.images[0]?.image_url || product.thumbnail || '/placeholder-image.jpg'} 
                    alt={product.name || 'Product Image'} 
                    className="w-full aspect-[3/4] object-cover" 
                />
                
                {!compact && showQuickAdd && hasVariants && (
                    <div 
                        className="absolute bottom-0 left-0 right-0 h-1/2 backdrop-blur-md bg-black/30 flex flex-col items-center justify-center p-4 transition-all rounded-t-xl duration-200"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <div className="text-gray-900 text-sm font-semibold mb-3 flex items-center gap-1">
                            Thêm nhanh vào giỏ hàng
                            <span className="text-lg">+</span>
                        </div>

                        {product.colors && product.colors.length > 1 && (
                            <div className="flex gap-2 mb-3">
                                {product.colors.map((color) => (
                                    <button
                                        key={color.color_id}
                                        onClick={(e) => handleColorChange(e, color)}
                                        className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                                            selectedColor?.color_id === color.color_id 
                                                ? 'border-black scale-110 ring-2 ring-offset-1 ring-black' 
                                                : 'border-gray-300'
                                        } transition-transform`}
                                        style={{ backgroundColor: color.hex_code }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-2 w-full max-w-[200px]">
                            {selectedColor?.sizes?.map((size) => (
                                <button
                                    key={size.variant_id}
                                    onClick={(e) => handleQuickAddToCart(e, size)}
                                    disabled={size.stock_quantity === 0 || addingToCart}
                                    className={`
                                        px-3 py-2 text-sm font-semibold rounded-lg
                                        ${size.stock_quantity === 0 
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed line-through' 
                                            : 'bg-white text-gray-900 hover:bg-gray-900 hover:text-white border border-gray-300'
                                        }
                                        ${addingToCart ? 'opacity-50 cursor-wait' : ''}
                                        transition-all
                                    `}
                                >
                                    {size.size_name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className={`flex flex-col flex-grow w-full min-w-0 ${compact ? 'p-2' : 'p-4'}`}>
                <h3
                className={`line-clamp-${compact ? '1' : '2'} overflow-hidden text-ellipsis break-words ${compact ? 'min-h-[24px]' : 'min-h-[48px]'} ${compact ? 'text-xs' : 'text-sm'}`}
                >
                {product.name || 'Tên sản phẩm'}
                </h3>
                
                {/* rating */}
                <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                            const rating = product.average_rating || 0;
                            const isFilled = star <= Math.floor(rating);
                            const isHalf = star === Math.ceil(rating) && rating % 1 >= 0.5;
                            
                            return (
                                <Star 
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                        isFilled 
                                            ? 'fill-yellow-400 text-yellow-400' 
                                            : isHalf
                                            ? 'fill-yellow-200 text-yellow-400'
                                            : 'fill-none text-gray-300'
                                    }`} 
                                />
                            );
                        })}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        {product.average_rating && product.average_rating > 0 
                            ? product.average_rating.toFixed(1) 
                            : '0'}
                    </span>
                    <span className="text-xs text-gray-500">
                        ({product.review_count || 0 } reviews) 
                    </span>
                </div>
                
                <div className='mt-auto'>
                    <div className='flex items-center flex-wrap justify-between'>
                        <div className="flex flex-col">
                            {product.has_promotion && product.discounted_price ? (
                                <div className="flex items-baseline gap-2">
                                    <span className={`${compact ? 'text-sm' : 'text-md'} font-semibold text-red-500`}>
                                        {formatVNDPrice(product.discounted_price)}
                                    </span>
                                    {product.base_price && (
                                        <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 line-through`}>
                                            {formatVNDPrice(product.base_price)}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className={`${compact ? 'text-sm' : 'text-md'} font-semibold text-gray-900`}>
                                    {formatVNDPrice(product.base_price)}
                                </span>
                            )}
                        </div>

                    </div>
                    {product.colors && product.colors.length > 0 && !compact ? ( // Ẩn colors ở mode compact để nhỏ gọn
                        <div className="flex gap-2 mb-2 mt-2 flex-wrap">
                            {product.colors.map((color) => (
                                <div 
                                    key={color?.color_id || Math.random()} 
                                    className="w-8 h-4 rounded-full border-2 border-gray-300 cursor-pointer"
                                    style={{ backgroundColor: color?.hex_code || '#ccc' }}
                                    title={color?.name || 'Màu sắc'}
                                />
                            ))}
                        </div>
                    ) : null}
                    
                </div>

            </div>
            {product.discount_percent && product.discount_percent > 0 ? (
                <div className={`absolute top-3 left-3 bg-red-500 text-white ${compact ? 'text-xxs px-1 py-0.5' : 'text-xs px-2 py-1'} font-bold rounded`}>
                    -{product.discount_percent}%
                </div>
            ) : null}
            <button  
                className={`cursor-pointer absolute top-3 right-3 rounded-full bg-white border border-black-500 ${compact ? 'px-1 py-1' : 'px-2 py-2'} ${loading ? 'opacity-50' : ''}`}
                onClick={handleToggleFavorite}
                disabled={loading}
            >
                <HeartIcon 
                    className={(liked ? 'text-red-500' : 'text-gray-400') + ' transition-colors duration-200'} 
                    fill={liked ? 'currentColor' : 'none'}
                    size={compact ? 16 : 20}
                />
            </button>
            
        </div>
    )
}