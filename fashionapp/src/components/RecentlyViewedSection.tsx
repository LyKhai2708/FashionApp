import { Eye } from 'lucide-react';
import ProductSlider from './ProductSlider';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

interface RecentlyViewedSectionProps {
    currentProductId?: number;
    limit?: number;
}

const RecentlyViewedSection = ({ 
    currentProductId, 
    limit = 10 
}: RecentlyViewedSectionProps) => {
    const { products } = useRecentlyViewed();

    const displayProducts = products
        .filter(p => p.product_id !== currentProductId)
        .slice(0, limit);

    if (displayProducts.length === 0) {
        return null;
    }

    return (
        <div className="py-8">
            <div className="flex items-center gap-2 mb-6">
                <h2 className="font-semibold text-2xl">SẢN PHẨM ĐÃ XEM GẦN ĐÂY</h2>
            </div>

            <ProductSlider
                products={displayProducts}
                showTitle={false}
                slidesPerView={{
                    mobile: 2,
                    tablet: 3,
                    desktop: 5
                }}
            />
        </div>
    );
};

export default RecentlyViewedSection;
