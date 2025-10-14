import { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { Zap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductSlider from '../ProductSlider';
import Countdown from './CountDown';
import promotionService from '../../services/promotionService';
import type { Promotion } from '../../services/promotionService';
import type { Product } from '../../types/product';

const PromotionTabsSection = () => {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [activeKey, setActiveKey] = useState<string>('0');
    const [productsCache, setProductsCache] = useState<Record<number, Product[]>>({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Fetch promotions
    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                setInitialLoading(true);
                const promos = await promotionService.getCurrentPromotions(10);
                setPromotions(promos);
                
                // Auto-select first promotion and fetch its products
                if (promos.length > 0) {
                    setActiveKey('0');
                    fetchProducts(promos[0].promo_id);
                }
            } catch (error) {
                console.error('Error fetching promotions:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchPromotions();
    }, []);

    // Fetch products for selected promotion
    const fetchProducts = async (promoId: number) => {
        // Check cache first
        if (productsCache[promoId]) {
            return;
        }

        setLoading(true);
        try {
            const response = await promotionService.getPromotionProducts(promoId, { 
                limit: 8 
            });
            
            const { products } = response;
            
            setProductsCache(prev => ({
                ...prev,
                [promoId]: products || []
            }));
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (key: string) => {
        setActiveKey(key);
        const index = parseInt(key);
        if (promotions[index]) {
            fetchProducts(promotions[index].promo_id);
        }
    };

    // Initial loading
    if (initialLoading) {
        return (
            <section className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="h-64 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // No promotions
    if (promotions.length === 0) {
        return null;
    }

    const currentPromo = promotions[parseInt(activeKey)];
    const currentProducts = currentPromo ? productsCache[currentPromo.promo_id] || [] : [];

    return (
        <section className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Zap className="w-6 h-6 text-red-600" />
                    <h2 className="text-2xl font-bold">KHUYẾN MÃI HOT</h2>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                activeKey={activeKey}
                onChange={handleTabChange}
                type="card"
                className="promotion-tabs"
                items={promotions.map((promo, index) => ({
                    key: index.toString(),
                    label: (
                        <div className="flex items-center gap-2 px-2">
                            <span className="font-medium text-black text-sm md:text-base truncate max-w-[120px] md:max-w-none">
                                {promo.name}
                            </span>
                            <span className="text-red-600 font-bold text-xs md:text-sm whitespace-nowrap">
                                -{promo.discount_percent}%
                            </span>
                        </div>
                    ),
                    children: (
                        <div className="py-6">
                            {/* Promotion Info */}
                            <div className="mb-6">
                                <h3 className="text-lg md:text-xl font-bold mb-2">
                                    {promo.name} - Giảm đến {promo.discount_percent}%
                                </h3>
                                {promo.description && (
                                    <p className="text-gray-600 mb-3 text-sm md:text-base">
                                        {promo.description}
                                    </p>
                                )}
                                <Countdown endDate={promo.end_date} />
                            </div>

                            {/* Products Slider */}
                            <ProductSlider 
                                products={currentProducts}
                                loading={loading}
                                slidesPerView={{
                                    mobile: 2,
                                    tablet: 3,
                                    desktop: 4
                                }}
                            />

                            {/* View All Link */}
                            {currentProducts.length > 0 && (
                                <div className="text-center mt-6">
                                    <Link
                                        to={`/promotions/${promo.promo_id}`}
                                        className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
                                    >
                                        Xem tất cả sản phẩm trong chương trình
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    )
                }))}
            />
        </section>
    );
};

export default PromotionTabsSection;