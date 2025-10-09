// ReviewItem.tsx
import React from 'react';
import { Rate, Avatar, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ReviewItemProps {
    review: {
        id: number;
        user_name: string;
        rating: number;
        comment: string;
        created_at: string;
        order_id: number;
        verified_purchase: boolean;
    };
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
    return (
        <div className="border-b border-gray-200 pb-4">
            <div className="flex items-start gap-3">
                <Avatar icon={<UserOutlined />} />
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{review.user_name}</span>
                                {review.verified_purchase && (
                                    <Tag color="green">Đã mua hàng</Tag>
                                )}
                            </div>
                            <Rate disabled value={review.rating} className="text-sm" />
                        </div>
                        <div className="text-right text-sm text-gray-500">
                            <div>
                                {formatDistanceToNow(new Date(review.created_at), {
                                    addSuffix: true,
                                    locale: vi
                                })}
                            </div>
                            <div>Đơn hàng #{review.order_id}</div>
                        </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
            </div>
        </div>
    );
};

export default ReviewItem;