import { Minus, Plus, Heart } from 'lucide-react';
import ProductSlider from '../components/ProductSlider';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProductDetail } from '../hooks/useProductDetail';
import { formatVNDPrice } from '../utils/priceFormatter';
import { getImageUrl } from '../utils/imageHelper';
import Breadcrumb from '../components/Breadcrumb';
import { useCart } from '../contexts/CartContext';
import ReviewSection from '../components/review/ReviewSection';
import PolicyBenefits from '../components/PolicyBenefits';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import RecentlyViewedSection from '../components/RecentlyViewedSection';
import { useRelatedProducts } from '../hooks/useProductList';
import { Image } from 'antd';
import { useMessage } from '../App';

export default function ProductDetailPage() {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { addProduct } = useRecentlyViewed();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { id } = useParams<{ id: string }>();
    const message = useMessage();

    const productId = parseInt(id || '0');

    const {
        product,
        loading,
        error,
        selectedColor,
        selectedSize,
        selectedVariant,
        availableSizes,
        stockQuantity,
        setSelectedColor,
        setSelectedSize,
        toggleFavorite,
        favoriteLoading
    } = useProductDetail(productId);

    const [activeTab, setActiveTab] = useState('description');
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const {
        products: relatedProductsRaw,
        loading: relatedLoading
    } = useRelatedProducts(product?.category_id, 8);

    const relatedProducts = relatedProductsRaw.filter(p => p.product_id !== productId);

    useEffect(() => {
        setSelectedImageIndex(0);
    }, [selectedColor]);

    //them vao danh sach da xem
    useEffect(() => {
        if (product) {
            addProduct(product.product_id);
        }
    }, [product, addProduct]);


    const handleAddToCart = async () => {
        if (!product || !selectedVariant) {
            message.warning('Please select color and size');
            return;
        }
        if (stockQuantity <= 0) {
            message.warning('Product is out of stock');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                product_variants_id: selectedVariant.variant_id,
                quantity: quantity,
            };


            const productDetails = {
                product_id: product.product_id,
                product_name: product.name,
                thumbnail: mainImage,
                price: product.price_info.has_promotion ? product.price_info.discounted_price : product.price_info.base_price,
                variant: selectedVariant,
            };

            await addToCart(payload, productDetails);
        } catch (error) {
            console.error('Failed to add to cart from detail page:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBuyNow = async () => {
        if (!product || !selectedVariant) {
            message.warning('Please select color and size');
            return;
        }
        if (stockQuantity <= 0) {
            message.warning('Product is out of stock');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                product_variants_id: selectedVariant.variant_id,
                quantity: quantity,
            };

            const productDetails = {
                product_id: product.product_id,
                product_name: product.name,
                thumbnail: mainImage,
                price: product.price_info.has_promotion ? product.price_info.discounted_price : product.price_info.base_price,
                variant: selectedVariant,
            };

            await addToCart(payload, productDetails);


            navigate('/cart');
        } catch (error) {
            console.error('Failed to buy now:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuantityChange = (delta: number) => {
        const newQuantity = quantity + delta;
        if (newQuantity >= 1 && newQuantity <= stockQuantity) {
            setQuantity(newQuantity);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
                    <p className="text-gray-600">{error || 'Product does not exist'}</p>
                </div>
            </div>
        );
    }

    const breadcrumbs = [
        { label: "Home", href: "/" },
        { label: "Products", href: "/products" },
        { label: product.name }
    ];

    const currentImages = selectedColor?.images || [];
    const mainImage = currentImages[selectedImageIndex]?.image_url || product.thumbnail;


    return (
        <>
            <Breadcrumb items={breadcrumbs} />

            <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex gap-3">
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[700px] pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
                        {currentImages.map((image, index) => (
                            <div
                                key={index}
                                onClick={() => setSelectedImageIndex(index)}
                                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${index === selectedImageIndex
                                    ? 'border-black shadow-lg'
                                    : 'border-gray-200 hover:border-gray-400'
                                    }`}
                            >
                                <img
                                    src={getImageUrl(image.image_url)}
                                    className="w-24 h-32 object-cover"
                                    alt={`${product.name} - ${index + 1}`}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex-1">
                        <div className="relative rounded-lg overflow-hidden shadow-lg group">
                            <Image.PreviewGroup
                                items={currentImages.map(img => getImageUrl(img.image_url))}
                                current={selectedImageIndex}
                            >
                                <Image
                                    className='w-full object-cover aspect-[3/4] block cursor-pointer'
                                    src={getImageUrl(mainImage)}
                                    alt={product.name}
                                    preview={{
                                        current: selectedImageIndex,
                                        onVisibleChange: (visible) => {
                                            if (!visible) {
                                                // 
                                            }
                                        }
                                    }}
                                    style={{ cursor: 'zoom-in' }}
                                />
                            </Image.PreviewGroup>

                            {currentImages.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setSelectedImageIndex(prev =>
                                            prev === 0 ? currentImages.length - 1 : prev - 1
                                        )}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        aria-label="Previous image"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={() => setSelectedImageIndex(prev =>
                                            prev === currentImages.length - 1 ? 0 : prev + 1
                                        )}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        aria-label="Next image"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}

                            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 pointer-events-none">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                                Click to zoom
                            </div>

                            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium z-20 pointer-events-none">
                                {selectedImageIndex + 1} / {currentImages.length}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h1 className='text-2xl font-semibold'>{product.name}</h1>
                    <div className='mt-2 flex gap-4 flex-wrap'>
                        <span className='text-sm text-gray-500'>
                            Slug: <span className='text-black font-semibold'>{product.slug}</span>
                        </span>
                        <span className='text-sm text-gray-500'>
                            In stock: <span className='text-black font-semibold'>{stockQuantity}</span>
                        </span>
                        <span className='text-sm text-gray-500'>
                            Brand: <span className='text-black font-semibold'>{product.brand_name}</span>
                        </span>
                    </div>

                    <div className='flex items-baseline gap-2 mt-4'>

                        {product.price_info.has_promotion ? (
                            <>
                                <span className='text-black font-semibold text-lg'>
                                    {formatVNDPrice(product.price_info.discounted_price)}
                                </span>
                                <span className='line-through text-gray-400 text-lg'>
                                    {formatVNDPrice(product.price_info.base_price)}
                                </span>
                                <div className='bg-red-500 text-white text-xs font-bold px-2 py-1 rounded'>
                                    -{product.price_info.discount_percent}%
                                </div>
                            </>
                        ) : <span className='text-2xl font-semibold text-black-600'>
                            {formatVNDPrice(product.price_info.base_price)}
                        </span>

                        }
                    </div>

                    {/* Color Selection */}
                    <div className='mt-6'>
                        <span className='font-semibold inline-block'>Color: <span className='text-gray-500 font-semibold'>{selectedColor?.name}</span></span>
                        <div className="flex gap-2 mt-2">
                            {product.variants
                                .reduce((colors: any[], variant) => {
                                    if (!colors.find(c => c.color_id === variant.color.color_id)) {
                                        colors.push(variant.color);
                                    }
                                    return colors;
                                }, [])
                                .map((color) => (
                                    <button
                                        key={color.color_id}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-15 h-8 rounded-full border-2 cursor-pointer hover:border-black transition-colors ${selectedColor?.color_id === color.color_id
                                            ? 'border-blue-600 ring-1 ring-gray-300'
                                            : 'border-gray-300 hover:border-blue-600 hover:ring-1 hover:ring-gray-300'
                                            }`}
                                        style={{ backgroundColor: color.hex_code }}
                                        title={color.name}
                                    />
                                ))
                            }
                        </div>
                    </div>

                    <div className='mt-6'>
                        <span className='font-semibold block'>Size: <span className='text-gray-500'>{selectedSize?.name}</span></span>
                        <div className='flex gap-2 mt-2'>
                            {availableSizes.map((size) => (
                                <button
                                    key={size.size_id}
                                    className={`cursor-pointer font-semibold transition border px-4 py-2 rounded-xl ${size.size_id === selectedSize?.size_id
                                        ? 'border-black bg-black text-white'
                                        : 'bg-gray-200 border-gray-200 text-gray-500 hover:bg-black hover:text-white'
                                        }`}
                                    onClick={() => setSelectedSize(size)}
                                >
                                    {size.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className='mt-6 flex items-center gap-4'>
                        <span className='font-semibold'>Quantity:</span>
                        <div className='inline-flex items-center border border-gray-400 rounded'>
                            <button
                                className='cursor-pointer px-3 py-2 rounded-l transition disabled:opacity-50 disabled:cursor-not-allowed'
                                onClick={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1}
                            >
                                <Minus size={16} />
                            </button>
                            <input
                                type="number"
                                min={1}
                                max={stockQuantity}
                                value={quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val >= 1 && val <= stockQuantity) {
                                        setQuantity(val);
                                    }
                                }}
                                className='w-16 h-10 text-center text-lg font-semibold border-0 outline-none'
                                style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                            />
                            <button
                                className='cursor-pointer px-3 py-2 rounded-r transition disabled:opacity-50 disabled:cursor-not-allowed'
                                onClick={() => handleQuantityChange(1)}
                                disabled={quantity >= stockQuantity}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    <div className='mt-8 flex flex-col md:flex-row gap-4'>
                        <button
                            onClick={handleAddToCart}
                            className='flex-1 py-3 text-white bg-black font-medium rounded cursor-pointer hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed'
                            disabled={stockQuantity === 0 || !selectedVariant || isSubmitting}
                        >
                            {isSubmitting ? 'Adding...' : (stockQuantity === 0 ? 'Out of stock' : 'Add to cart')}
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className='flex-1 bg-white rounded border font-medium py-3 cursor-pointer hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed'
                            disabled={stockQuantity === 0 || !selectedVariant || isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Buy Now'}
                        </button>
                        <button
                            onClick={toggleFavorite}
                            disabled={favoriteLoading}
                            className={`p-3 rounded border font-medium cursor-pointer transition disabled:opacity-50 ${product.is_favorite
                                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${product.is_favorite ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    <PolicyBenefits />

                    {/* Product Tabs */}
                    <div className='mt-8'>
                        <div className='flex border-b border-gray-300'>
                            <button
                                className={`flex-1 text-start py-3 cursor-pointer transition font-semibold border-b-2 ${activeTab === 'description'
                                    ? 'border-black text-black bg-gray-50'
                                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                    }`}
                                onClick={() => setActiveTab("description")}
                            >
                                PRODUCT DESCRIPTION
                            </button>
                            <button
                                className={`flex-1 text-start py-3 cursor-pointer transition font-semibold border-b-2 ${activeTab === 'instruction'
                                    ? 'border-black text-black bg-gray-50'
                                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                    }`}
                                onClick={() => setActiveTab("instruction")}
                            >
                                CARE INSTRUCTIONS
                            </button>
                        </div>
                    </div>

                    <div className='mt-4 min-h-[200px]'>
                        {activeTab === 'description' && (
                            <div>
                                <p className='text-gray-700 leading-relaxed whitespace-pre-line'>
                                    {product.description}
                                </p>
                            </div>
                        )}
                        {activeTab === 'instruction' && (
                            <div>
                                <ul className='list-disc list-inside text-gray-700 leading-relaxed space-y-2'>
                                    <li>Avoid contact with water for extended periods to maintain material durability.</li>
                                    <li>Clean the product with a damp cloth or soft brush to remove dirt.</li>
                                    <li>Do not use strong detergents or soak the product in water.</li>
                                    <li>Store the product in a dry, well-ventilated place away from direct sunlight.</li>
                                    <li>Proper storage helps maintain product quality and durability.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ReviewSection productId={productId} />
            <div className="mt-20">
                <h2 className="text-xl font-bold mb-4">Recently Viewed</h2>
                <RecentlyViewedSection />
            </div>

            <div className="mt-20">
                <h2 className="text-xl font-bold mb-4">Related Products</h2>
                <ProductSlider products={relatedProducts} loading={relatedLoading} />
            </div>
        </>
    );
}