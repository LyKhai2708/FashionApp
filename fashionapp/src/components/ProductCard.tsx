import { HeartIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types/product';
import { formatVNDPrice } from '../utils/priceFormatter';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from '../contexts/AuthContext';

interface ProductCardProps {
    product: Product;
    compact?: boolean; // true hiển thị ở chế độ nhỏ gọn
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(product.is_favorite || false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLiked(product.is_favorite || false);
    }, [product.is_favorite, user?.id]);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            alert('Vui lòng đăng nhập để thêm sản phẩm yêu thích');
            return;
        }

        if (loading) return;

        try {
            setLoading(true);

            setLiked(!liked);
            
            const result = await favoriteService.toggleFavorite(
                product.product_id,
                liked ? product.favorite_id : undefined
            );
            

        } catch (error: any) {

            setLiked(liked);
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
    
    return (
        <div 
            className={`cursor-pointer relative group flex flex-col border border-gray-200 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow duration-300 h-full group-hover:z-20 ${compact ? 'text-xs' : ''}`}
            onClick={handleCardClick}
        >
            <img 
                src={product.thumbnail || '/placeholder-image.jpg'} 
                alt={product.name || 'Product Image'} 
                className="w-full aspect-[3/4] object-cover" 
            />
            <div className={`flex flex-col flex-grow w-full min-w-0 ${compact ? 'p-2' : 'p-4'}`}>
                <h3
                className={`mb-2 line-clamp-${compact ? '1' : '2'} overflow-hidden text-ellipsis break-words ${compact ? 'min-h-[24px]' : 'min-h-[48px]'} ${compact ? 'text-xs' : 'text-sm'}`}
                >
                {product.name || 'Tên sản phẩm'}
                </h3>
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