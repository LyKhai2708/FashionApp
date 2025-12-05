import { HeartIcon, Star } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product, ProductColor, ProductSize } from '../types/product';
import { formatVNDPrice } from '../utils/priceFormatter';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useMessage } from '../App';
import { useFavorites } from '../contexts/FavoritesContext';
import { getImageUrl } from '../utils/imageHelper';

interface ProductCardProps {
    product: Product;
    compact?: boolean;
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const message = useMessage();
    const navigate = useNavigate();
    const { isFavorite, getFavoriteId, toggleFavorite } = useFavorites();
    const [loading, setLoading] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
        product.colors && product.colors.length > 0 ? product.colors[0] : null
    );
    const [addingToCart, setAddingToCart] = useState(false);

    const liked = isFavorite(product.product_id);
    const favoriteId = getFavoriteId(product.product_id);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            message.warning('Please log in to add favorites');
            return;
        }

        if (loading) return;

        try {
            setLoading(true);
            await toggleFavorite(product.product_id, favoriteId);
        } catch (error: any) {
            console.error('Toggle favorite error:', error);
            message.error(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = () => {
        navigate(`/products/${product.product_id}`);
    };

    const handleQuickAddToCart = async (e: React.MouseEvent, size: ProductSize) => {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedColor) {
            console.error('No color selected');
            return;
        }
        if (addingToCart) return;
        if (!size.variant_id) {
            console.error('Invalid variant_id');
            return;
        }

        try {
            setAddingToCart(true);

            const payload = {
                product_variants_id: size.variant_id,
                quantity: 1
            };

            const finalPrice = parseFloat(String(product.discounted_price || product.base_price));
            const thumbnail = selectedColor.images?.[0]?.image_url || selectedColor.primary_image || product.thumbnail;

            const productDetails = {
                product_id: product.product_id,
                product_name: product.name,
                slug: product.slug,
                thumbnail: thumbnail,
                price: finalPrice,
                variant: {
                    variant_id: size.variant_id,
                    stock_quantity: size.stock_quantity,
                    final_price: finalPrice,
                    active: 1,
                    color: {
                        color_id: selectedColor.color_id,
                        name: selectedColor.name,
                        hex_code: selectedColor.hex_code,
                        images: selectedColor.images || []
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
    const hasColors = product.colors && product.colors.length > 0;


    return (
        <div
            className={`cursor-pointer relative group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full group-hover:z-20 border border-gray-100 hover:border-gray-200 ${compact ? 'text-xs' : ''}`}
            onClick={handleCardClick}
            onMouseEnter={() => !compact && setShowQuickAdd(true)}
            onMouseLeave={() => !compact && setShowQuickAdd(false)}
        >
            <div className="relative overflow-hidden">
                <img
                    src={getImageUrl(selectedColor?.images[0]?.image_url || product.thumbnail)}
                    alt={product.name || 'Product Image'}
                    className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {!compact && showQuickAdd && hasColors && (
                    <div
                        className="absolute bottom-0 left-0 right-0 h-1/2 backdrop-blur-sm bg-white/30 flex flex-col items-center justify-center p-4 transition-all duration-200 border-t border-gray-200/50"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <div className="text-gray-900 text-sm font-bold mb-3 flex items-center gap-2">
                            Quick add to cart +
                        </div>

                        {product.colors && product.colors.length > 1 && (
                            <div className="flex gap-2 mb-3">
                                {product.colors.map((color) => (
                                    <button
                                        key={color.color_id}
                                        onClick={(e) => handleColorChange(e, color)}
                                        className={`w-6 h-6 rounded-full border-2 cursor-pointer ${selectedColor?.color_id === color.color_id
                                                ? 'border-black scale-110 ring-2 ring-offset-1 ring-black'
                                                : 'border-gray-300'
                                            } transition-transform`}
                                        style={{ backgroundColor: color.hex_code }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        )}

                        {hasVariants ? (
                            <div className="grid grid-cols-3 gap-2 w-full max-w-[200px]">
                                {selectedColor?.sizes?.map((size) => (
                                    <button
                                        key={size.variant_id}
                                        onClick={(e) => handleQuickAddToCart(e, size)}
                                        disabled={size.stock_quantity === 0 || addingToCart}
                                        className={`
                                        px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer
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
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-gray-700 text-sm mb-2 font-medium">
                                    This color is out of stock
                                </div>
                                <div className="text-xs text-gray-500">
                                    Choose another color or view details
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className={`flex flex-col flex-grow w-full min-w-0 ${compact ? 'p-3' : 'p-5'}`}>
                <h3
                    className={`line-clamp-${compact ? '1' : '2'} overflow-hidden text-ellipsis break-words ${compact ? 'min-h-[24px]' : 'min-h-[48px]'} ${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors`}
                >
                    {product.name || 'Product name'}
                </h3>

                {/* rating */}
                {!compact && (
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => {
                                const rating = product.average_rating || 0;
                                const isFilled = star <= Math.floor(rating);
                                const isHalf = star === Math.ceil(rating) && rating % 1 >= 0.5;

                                return (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${isFilled
                                                ? 'fill-amber-400 text-amber-400'
                                                : isHalf
                                                    ? 'fill-amber-200 text-amber-400'
                                                    : 'fill-none text-gray-300'
                                            }`}
                                    />
                                );
                            })}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                            {product.average_rating && product.average_rating > 0
                                ? product.average_rating.toFixed(1)
                                : '0'}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {product.review_count || 0} reviews
                        </span>
                    </div>)
                }

                <div className='mt-auto'>
                    <div className='flex items-center flex-wrap justify-between'>
                        <div className="flex flex-col">
                            {product.has_promotion && product.discounted_price ? (
                                <div className="flex items-baseline gap-2">
                                    <span className={`${compact ? 'text-base' : 'text-lg'} font-bold text-red-600`}>
                                        {formatVNDPrice(product.discounted_price)}
                                    </span>
                                    {product.base_price && (
                                        <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 line-through`}>
                                            {formatVNDPrice(product.base_price)}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className={`${compact ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>
                                    {formatVNDPrice(product.base_price)}
                                </span>
                            )}
                        </div>

                    </div>
                    {product.colors && product.colors.length > 0 && !compact ? (
                        <div className="flex gap-1.5 mb-2 mt-3 flex-wrap">
                            {product.colors.slice(0, 5).map((color) => (
                                <div
                                    key={color?.color_id || Math.random()}
                                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color?.hex_code || '#ccc' }}
                                    title={color?.name || 'Color'}
                                />
                            ))}
                            {product.colors.length > 5 && (
                                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-semibold text-gray-600">
                                    +{product.colors.length - 5}
                                </div>
                            )}
                        </div>
                    ) : null}

                </div>

            </div>
            {product.discount_percent && product.discount_percent > 0 ? (
                <div className={`absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white ${compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'} font-bold rounded-full shadow-lg`}>
                    -{product.discount_percent}%
                </div>
            ) : null}

            {!compact && (<button
                className={`cursor-pointer absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl ${compact ? 'p-2' : 'p-2.5'} ${loading ? 'opacity-50' : ''} hover:scale-110 transition-all duration-200 border border-gray-200`}
                onClick={handleToggleFavorite}
                disabled={loading}
            >
                <HeartIcon
                    className={(liked ? 'text-red-500' : 'text-gray-500') + ' transition-colors duration-200'}
                    fill={liked ? 'currentColor' : 'none'}
                    size={18}
                />
            </button>)
            }

        </div>
    )
}