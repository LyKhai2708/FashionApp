import React from 'react';
import { Rate, Spin } from 'antd';
import { Star } from 'lucide-react';
import reviewService from '../../services/reviewService';
import { useState, useEffect } from 'react';
interface ReviewStatsData {
    average_rating: number;
    total_reviews: number;
    rating_breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

interface ReviewStatsProps {
    productId: number;
    refreshTrigger?: number;
}
const ReviewStats: React.FC<ReviewStatsProps> = ({productId, refreshTrigger = 0}) => {
    const [stats, setStats] = useState<ReviewStatsData>({
        average_rating: 0,
        total_reviews: 0,
        rating_breakdown: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        }
    });
    const [loading, setLoading] = useState(false);
    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await reviewService.getProductReviews(productId, 1, 1);
          
            setStats({
                average_rating: response.data.average_rating,
                total_reviews: response.data.total_reviews,
                rating_breakdown: response.data.rating_breakdown
            });
        } catch (error) {
            console.error('Error fetching review stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('refreshTrigger changed:', refreshTrigger);
        fetchStats();
    }, [productId, refreshTrigger]);

    if (loading) {
        return (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 flex justify-center">
                <Spin />
            </div>
        );
    }

    return (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall Rating */}
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-500 mb-2">
                        {stats.average_rating.toFixed(1)} trên 5
                    </div>
                    <Rate 
                    style={{color: 'red'}} 
                    disabled value={stats.average_rating} 
                    allowHalf className="mb-2" />
                    <div className="text-gray-600">
                        {stats.total_reviews} đánh giá
                    </div>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-2">
                    {([5, 4, 3, 2, 1] as const).map(rating => {
                    const count = stats.rating_breakdown[rating] || 0;
                    const percentage = stats.total_reviews > 0 
                            ? (count / stats.total_reviews) * 100 
                            : 0;
                    return (
                        <div key={rating} className="flex items-center gap-2">
                            <span className="block flex items-center w-8 text-sm gap-1 justify-end ">{rating} <Star className=' inline-block w-4 h-4' /></span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-yellow-400 h-2 rounded-full"
                                    style={{ 
                                        width: `${percentage}%` 
                                    }}
                                />
                            </div>
                            <span className="w-8 text-sm text-gray-600">
                                {count}
                            </span>
                        </div>
                    );
            })}
                </div>
            </div>
        </div>
    );
};

export default ReviewStats;