import React, { useState } from 'react';
import { Rate, Avatar, Tag, Button, Popconfirm, message } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Review } from '../../services/reviewService';
import reviewService from '../../services/reviewService';
import authService from '../../services/authService';
import ReviewForm from './ReviewForm';
interface ReviewItemProps {
    review: Review;
    onUpdate?: () => void;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review, onUpdate }) => {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const currentUserId = authService.getCurrentUser()?.id;
    const userRole = authService.getCurrentUser()?.role;
    
    const canEdit = currentUserId === review.user_id;
    const canDelete = currentUserId === review.user_id || userRole === 'admin';

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await reviewService.deleteReview(review.id);
            message.success('Xóa đánh giá thành công');
            if (onUpdate) onUpdate();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Không thể xóa đánh giá');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <div className="border-b border-gray-200 pb-4">
                <div className="flex items-start gap-3">
                    <Avatar icon={<UserOutlined />} />
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{review.customer_name}</span>
                                    {review.is_verified_purchase && (
                                        <Tag color="green">Đã mua hàng</Tag>
                                    )}
                                </div>
                                <Rate disabled value={review.rating} className="text-sm" />
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">
                                    {formatDistanceToNow(new Date(review.created_at), {
                                        addSuffix: true,
                                        locale: vi
                                    })}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Đơn hàng #{review.order_id}
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-gray-700 leading-relaxed mb-3">
                            {review.comment}
                        </p>

                        {/* Action buttons */}
                        {(canEdit || canDelete) && (
                            <div className="flex gap-2">
                                {canEdit && (
                                    <Button
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => setEditModalVisible(true)}
                                    >
                                        Sửa
                                    </Button>
                                )}
                                {canDelete && (
                                    <Popconfirm
                                        title="Xóa đánh giá"
                                        description="Bạn có chắc muốn xóa đánh giá này?"
                                        onConfirm={handleDelete}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        okButtonProps={{ danger: true, loading: deleting }}
                                    >
                                        <Button
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            loading={deleting}
                                        >
                                            Xóa
                                        </Button>
                                    </Popconfirm>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <ReviewForm
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                onSuccess={() => {
                    setEditModalVisible(false);
                    if (onUpdate) onUpdate();
                }}
                productId={review.product_id}
                editMode={true}
                reviewId={review.id}
                initialData={{
                    rating: review.rating,
                    comment: review.comment,
                    order_id: review.order_id
                }}
            />
        </>
    );
};

export default ReviewItem;