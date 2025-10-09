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

    return (
        <div className="mt-10 pt-8">
            <h2 className="text-xl font-bold mb-4">Đánh giá sản phẩm</h2>
            
            <ReviewStats />
            
            <ReviewFilters 
                sortBy={sortBy}
                setSortBy={setSortBy}
                filterRating={filterRating}
                setFilterRating={setFilterRating}
            />
            
            <ReviewList 
                sortBy={sortBy}
                filterRating={filterRating}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
        </div>
    );
};

export default ReviewSection;