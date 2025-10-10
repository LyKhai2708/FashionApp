import React from 'react';
import { Pagination } from 'antd';
import ReviewItem from './ReviewItem';

interface ReviewListProps {
    sortBy: string;
    filterRating: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({
    sortBy,
    filterRating,
    currentPage,
    setCurrentPage
}) => {
    const mockReviews = [
        {
            id: 1,
            user_name: "Nguyễn Văn A",
            rating: 5,
            comment: "Sản phẩm rất tốt, chất lượng cao",
            created_at: "2024-01-15T10:30:00Z",
            order_id: 123,
            verified_purchase: true
        },
        // ... more mock data
    ];

    const pageSize = 5;
    const total = 25;

    return (
        <div>
            <div className="space-y-4 mb-6">
                {mockReviews.map(review => (
                    <ReviewItem key={review.id} review={review} />
                ))}
            </div>

            <div className="flex justify-center">
                <Pagination
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    onChange={setCurrentPage}
                    showSizeChanger={false}
                />
            </div>
        </div>
    );
};

export default ReviewList;