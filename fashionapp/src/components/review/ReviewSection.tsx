import React, { useState } from 'react';
import ReviewStats from './ReviewStats';
import ReviewFilters from './ReviewFilter';
import ReviewList from './ReviewList';

interface ReviewSectionProps {
    productId: number;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId }) => {
    const [sortBy, setSortBy] = useState('newest');
    const [filterRating, setFilterRating] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleReviewUpdate = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="mb-4">
                <h2 className="text-2xl font-bold">Đánh giá sản phẩm</h2>
            </div>

            <ReviewStats
                productId={productId}
                refreshTrigger={refreshTrigger}
            />

            <ReviewFilters
                sortBy={sortBy}
                setSortBy={setSortBy}
                filterRating={filterRating}
                setFilterRating={setFilterRating}
            />

            <ReviewList
                productId={productId}
                sortBy={sortBy}
                filterRating={filterRating}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                refreshTrigger={refreshTrigger}
                onReviewUpdate={handleReviewUpdate}
            />
        </div>
    );
};

export default ReviewSection;