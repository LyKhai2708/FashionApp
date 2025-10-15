import { Minus, Plus, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductSlider from '../components/ProductSlider';
import { useProductDetail } from '../hooks/useProductDetail';
import { formatVNDPrice } from '../utils/priceFormatter';
import Breadcrumb from '../components/Breadcrumb';
import { extractProductIdFromSlug } from '../utils/slugUtils';
import { useCart } from '../contexts/CartContext';
import ReviewSection from '../components/review/ReviewSection';
import PolicyBenefits from '../components/PolicyBenefits';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import RecentlyViewedSection from '../components/RecentlyViewedSection';
import { useRelatedProducts } from '../hooks/useProductList';

export default function ProductDetailPage() {
    const { addToCart } = useCart();
    const { addProduct } = useRecentlyViewed();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { slug } = useParams<{ slug: string }>();
    
    const productId = extractProductIdFromSlug(slug || '');
    
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

    //them vao danh sach xem qua
    useEffect(() => {
        if (product) {
            const colorMap = new Map();
            
            product.variants?.forEach(variant => {
                const colorId = variant.color.color_id;
                
                if (!colorMap.has(colorId)) {
                    colorMap.set(colorId, {
                        color_id: variant.color.color_id,
                        name: variant.color.name,
                        hex_code: variant.color.hex_code,
                        images: variant.color.images || [],
                        sizes: []
                    });
                }
                
                colorMap.get(colorId).sizes.push({
                    variant_id: variant.variant_id,
                    size_id: variant.size.size_id,
                    size_name: variant.size.name,
                    stock_quantity: variant.stock_quantity,
                    active: variant.active
                });
            });
            
            const productForStorage: any = {
                ...product,
                colors: Array.from(colorMap.values())
            };
            addProduct(productForStorage);
        }
    }, [product, addProduct]);


    const handleAddToCart = async () => {
        if (!product ||!selectedVariant) {
            alert('Vui lòng chọn màu sắc và kích cỡ');
            return;
        }
        if (stockQuantity <= 0) {
            alert('Sản phẩm đã hết hàng');
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
                    <p className="text-gray-600">{error || 'Sản phẩm không tồn tại'}</p>
                </div>
            </div>
        );
    }

    const breadcrumbs = [
        { label: "Trang chủ", href: "/" },
        { label: "Sản phẩm", href: "/products" },
        { label: product.name }
    ];

    const currentImages = selectedColor?.images || [];
    const mainImage = currentImages[selectedImageIndex]?.image_url || product.thumbnail;

    
    return (
        <>
            <Breadcrumb items={breadcrumbs} />
            
            <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Images Section */}
                <div>
                    <img
                        className='w-full rounded-lg shadow object-cover h-96'
                        src={mainImage}
                        alt={product.name}
                    />
                    <div className='flex gap-2 mt-4'>
                        {currentImages.map((image, index) => (
                            <img 
                                key={index}
                                src={image.image_url} 
                                className={`w-20 h-20 object-cover cursor-pointer border-2 rounded hover:border-black transition-colors ${
                                    index === selectedImageIndex ? 'border-black' : 'border-gray-200'
                                }`}
                                onClick={() => setSelectedImageIndex(index)}
                                alt={`${product.name} - ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Product Details Section */}
                <div>
                    <h1 className='text-2xl font-semibold'>{product.name}</h1>
                    <div className='mt-2 flex gap-4 flex-wrap'>
                        <span className='text-sm text-gray-500'>
                            Mã sản phẩm: <span className='text-black font-semibold'>{product.slug}</span>
                        </span>
                        <span className='text-sm text-gray-500'>
                            Hàng tồn: <span className='text-black font-semibold'>{stockQuantity}</span>
                        </span>
                        <span className='text-sm text-gray-500'>
                            Thương hiệu: <span className='text-black font-semibold'>{product.brand_name}</span>
                        </span>
                    </div>

                    {/* Price */}
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
                        ):<span className='text-2xl font-semibold text-black-600'>
                            {formatVNDPrice(product.price_info.base_price)}
                        </span>

                        }
                    </div>

                    {/* Color Selection */}
                    <div className='mt-6'>
                        <span className='font-semibold inline-block'>Màu sắc: <span className='text-gray-500 font-semibold'>{selectedColor?.name}</span></span>
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
                                        className={`w-15 h-8 rounded-full border-2 cursor-pointer hover:border-black transition-colors ${
                                            selectedColor?.color_id === color.color_id 
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

                    {/* Size Selection */}
                    <div className='mt-6'>
                        <span className='font-semibold block'>Kích thước: <span className='text-gray-500'>{selectedSize?.name}</span></span>
                        <div className='flex gap-2 mt-2'>
                            {availableSizes.map((size) => (
                                <button 
                                    key={size.size_id}
                                    className={`cursor-pointer font-semibold transition border px-4 py-2 rounded-xl ${
                                        size.size_id === selectedSize?.size_id 
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

                    {/* Quantity Selector */}
                    <div className='mt-6 flex items-center gap-4'>
                        <span className='font-semibold'>Số lượng:</span>
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
                                style={{WebkitAppearance: 'none', MozAppearance: 'textfield'}}
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

                    {/* Action Buttons */}
                    <div className='mt-8 flex flex-col md:flex-row gap-4'>
                        <button
                            onClick={handleAddToCart}
                            className='flex-1 py-3 text-white bg-black font-medium rounded cursor-pointer hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed'
                            disabled={stockQuantity === 0 || !selectedVariant || isSubmitting}
                        >
                            {isSubmitting ? 'Đang thêm...' : (stockQuantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng')}
                        </button>
                        <button 
                            className='flex-1 bg-white rounded border font-medium py-3 cursor-pointer hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed'
                            disabled={stockQuantity === 0 || !selectedVariant}
                        >
                            Mua Ngay
                        </button>
                        <button 
                            onClick={toggleFavorite}
                            disabled={favoriteLoading}
                            className={`p-3 rounded border font-medium cursor-pointer transition disabled:opacity-50 ${
                                product.is_favorite 
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
                                className={`flex-1 text-start py-3 cursor-pointer transition font-semibold border-b-2 ${
                                    activeTab === 'description' 
                                        ? 'border-black text-black bg-gray-50' 
                                        : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                }`} 
                                onClick={() => setActiveTab("description")}
                            >
                                MÔ TẢ SẢN PHẨM
                            </button>
                            <button 
                                className={`flex-1 text-start py-3 cursor-pointer transition font-semibold border-b-2 ${
                                    activeTab === 'instruction'
                                        ? 'border-black text-black bg-gray-50'
                                        : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                }`}
                                onClick={() => setActiveTab("instruction")}
                            >
                                HƯỚNG DẪN BẢO QUẢN
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
                                    <li>Tránh tiếp xúc với nước trong thời gian dài để giữ độ bền của chất liệu.</li>
                                    <li>Vệ sinh sản phẩm bằng khăn ẩm hoặc bàn chải mềm để loại bỏ bụi bẩn.</li>
                                    <li>Không sử dụng chất tẩy rửa mạnh hoặc ngâm sản phẩm trong nước.</li>
                                    <li>Để sản phẩm ở nơi khô ráo, thoáng mát và tránh ánh nắng trực tiếp.</li>
                                    <li>Bảo quản sản phẩm đúng cách để duy trì chất lượng và độ bền.</li>
                                </ul>
                            </div>
                        )}
                    </div>          
                </div>
            </div>
            <ReviewSection productId={productId} /> 
            <div className="mt-20">
                <h2 className="text-xl font-bold mb-4">Các sản phẩm đã xem</h2>
                <RecentlyViewedSection/>
            </div>
            
            <div className="mt-20">
                <h2 className="text-xl font-bold mb-4">Sản phẩm liên quan</h2>
                <ProductSlider products={relatedProducts} loading={relatedLoading} />
            </div>
        </>
    );
}