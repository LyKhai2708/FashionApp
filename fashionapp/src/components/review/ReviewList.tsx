import React from 'react';
import { Pagination, Spin, Empty } from 'antd';
import ReviewItem from './ReviewItem';
import type  { Review } from '../../services/reviewService';
import {useState, useEffect} from 'react';
import reviewService from '../../services/reviewService';
import { useMessage } from '../../App';
interface ReviewListProps {
    productId: number;
    sortBy: string;
    filterRating: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    refreshTrigger?: any;
}

const ReviewList: React.FC<ReviewListProps> = ({
    productId,
    sortBy,
    filterRating,
    currentPage,
    setCurrentPage,
    refreshTrigger = 0
}) => {
    const message = useMessage();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [metadata, setMetadata] = useState({
        totalRecords: 0,
        firstPage: 1,
        lastPage: 1,
        page: 1,
        limit: 5
    });
    
    const pageSize = 5;


    const fetchReviews = async () => {
        setLoading(true);
        try {
            console.log('Fetching reviews for product:', productId);
            const response = await reviewService.getProductReviews(
                productId,
                currentPage,
                pageSize,
                sortBy,
                filterRating
            );
            console.log('Fetched reviews:', response);
            setReviews(response.data.reviews);
            setMetadata(response.data.metadata);
        } catch (error: any) {
            console.error('Error fetching reviews:', error);
            message.error('Không thể tải đánh giá');
        } finally {
            setLoading(false);
        }
    }
    
    useEffect(() => {
        fetchReviews();
    }, [productId, currentPage, sortBy, filterRating, refreshTrigger]);

    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, filterRating]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Spin size="large" tip="Đang tải đánh giá..." />
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="py-12">
                <Empty
                    description={
                        filterRating > 0
                            ? `Chưa có đánh giá ${filterRating} sao`
                            : 'Chưa có đánh giá nào'
                    }
                />
            </div>
        );
    }

   return (
        <div>
            <div className="space-y-4 mb-6">
                {reviews.map(review => (
                    <ReviewItem 
                        key={review.id} 
                        review={review}
                        onUpdate={fetchReviews}
                    />
                ))}
            </div>

            {metadata.totalRecords > pageSize && (
                <div className="flex justify-center">
                    <Pagination
                        current={currentPage}
                        total={metadata.totalRecords}
                        pageSize={pageSize}
                        onChange={setCurrentPage}
                        showSizeChanger={false}
                        showTotal={(total) => `Tổng ${total} đánh giá`}
                    />
                </div>
            )}
        </div>
    );
};

export default ReviewList;