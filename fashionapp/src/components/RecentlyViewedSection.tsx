
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
        <div>
            <ProductSlider
                products={displayProducts}
                showTitle={false}
                slidesPerView={{
                    mobile: 2,
                    tablet: 3,
                    desktop: 4
                }}
            />
        </div>
    );
};

export default RecentlyViewedSection;
