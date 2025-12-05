import { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { Flame, ArrowRight } from 'lucide-react';
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
    const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);

    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                setInitialLoading(true);
                const promos = await promotionService.getCurrentPromotions(10);
                setPromotions(promos);


                const promosWithProducts: Promotion[] = [];
                const newProductsCache: Record<number, Product[]> = {};

                for (const promo of promos) {
                    try {
                        const response = await promotionService.getPromotionProducts(promo.promo_id, {
                            limit: 8
                        });
                        const { products } = response;


                        if (products && products.length > 0) {
                            promosWithProducts.push(promo);
                            newProductsCache[promo.promo_id] = products;
                        }
                    } catch (error) {
                        console.error(`Error fetching products for promotion ${promo.promo_id}:`, error);
                    }
                }

                setFilteredPromotions(promosWithProducts);
                setProductsCache(newProductsCache);

                // Auto-select first promotion
                if (promosWithProducts.length > 0) {
                    setActiveKey('0');
                }
            } catch (error) {
                console.error('Error fetching promotions:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchPromotions();
    }, []);

    const fetchProducts = async (promoId: number) => {
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
        if (filteredPromotions[index]) {
            fetchProducts(filteredPromotions[index].promo_id);
        }
    };

    if (initialLoading) {
        return (
            <section className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-64 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (filteredPromotions.length === 0) {
        return null;
    }

    const currentPromo = filteredPromotions[parseInt(activeKey)];
    const currentProducts = currentPromo ? productsCache[currentPromo.promo_id] || [] : [];

    return (
        <section className="container mx-auto px-4 py-12">
            <div className="border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Flame className="w-7 h-7 text-red-500" fill="currentColor" />
                    <h2 className="text-2xl font-extrabold text-gray-900">HOT DEALS</h2>
                </div>
                <Tabs
                    activeKey={activeKey}
                    onChange={handleTabChange}
                    className="promotion-tabs"
                    items={filteredPromotions.map((promo, index) => ({
                        key: index.toString(),
                        label: (
                            <span className="text-sm md:text-base font-medium">
                                {promo.name}
                            </span>
                        ),
                        children: (
                            <div className="pt-6">
                                <div className="bg-gray-50 rounded-xl p-5 mb-6">
                                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3">
                                        {promo.name} - Up to {promo.discount_percent}% off
                                    </h3>
                                    <Countdown endDate={promo.end_date} />
                                </div>

                                <ProductSlider
                                    products={currentProducts}
                                    loading={loading}
                                    slidesPerView={{
                                        mobile: 2,
                                        tablet: 3,
                                        desktop: 4
                                    }}
                                />

                                {currentProducts.length > 0 && (
                                    <div className="text-center mt-8">
                                        <Link
                                            to={`/promotions/${promo.promo_id}`}
                                            className="inline-flex items-center gap-2 text-red-500 hover:text-red-600 font-medium transition-colors"
                                        >
                                            View all products in this promotion
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )
                    }))}
                />
            </div>
        </section>
    );
};

export default PromotionTabsSection;