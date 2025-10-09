import React from 'react';
import { Rate } from 'antd';
import { Star } from 'lucide-react';
interface ReviewStatsData {
    average_rating: number;
    total_reviews: number;
    rating_breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

const ReviewStats: React.FC = () => {
    const stats: ReviewStatsData = {
        average_rating: 4.5,
        total_reviews: 25,
        rating_breakdown: {
            5: 15,
            4: 6,
            3: 2,
            2: 1,
            1: 1
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall Rating */}
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-500 mb-2">
                        {stats.average_rating.toFixed(1)} trên 5
                    </div>
                    <Rate style={{color: 'red'}} disabled value={stats.average_rating} allowHalf className="mb-2" />
                    <div className="text-gray-600">
                        {stats.total_reviews} đánh giá
                    </div>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-2">
                    {([5, 4, 3, 2, 1] as const).map(rating => (
                        <div key={rating} className="flex items-center gap-2">
                            <span className="block flex items-center w-8 text-sm gap-1 justify-end ">{rating} <Star className=' inline-block w-4 h-4' /></span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-yellow-400 h-2 rounded-full"
                                    style={{ 
                                        width: `${(stats.rating_breakdown[rating] / stats.total_reviews) * 100}%` 
                                    }}
                                />
                            </div>
                            <span className="w-8 text-sm text-gray-600">
                                {stats.rating_breakdown[rating]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewStats;