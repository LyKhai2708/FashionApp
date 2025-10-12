import React, { useState } from 'react';
import { Modal, Rate, Input, Button, Select, message } from 'antd';
import reviewService from '../../services/reviewService';

const { TextArea } = Input;

interface ReviewFormProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    productId: number;
    userOrders?: Array<{ order_id: number; order_date: string }>;
    editMode?: boolean;
    reviewId?: number;
    initialData?: {
        rating: number;
        comment: string;
        order_id?: number;
    };
}

const ReviewForm: React.FC<ReviewFormProps> = ({
    visible,
    onClose,
    onSuccess,
    productId,
    userOrders = [],
    editMode = false,
    reviewId,
    initialData
}) => {
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState(initialData?.rating || 5);
    const [comment, setComment] = useState(initialData?.comment || '');
    const [orderId, setOrderId] = useState<number | undefined>(initialData?.order_id);

    const handleSubmit = async () => {
        if (!editMode && !orderId) {
            message.error('Vui lòng chọn đơn hàng');
            return;
        }

        if (!comment.trim()) {
            message.error('Vui lòng nhập nội dung đánh giá');
            return;
        }

        setLoading(true);
        try {
            if (editMode && reviewId) {
                await reviewService.updateReview(reviewId, { rating, comment });
                message.success('Cập nhật đánh giá thành công!');
            } else {
                await reviewService.createReview(productId, {
                    order_id: orderId!,
                    rating,
                    comment
                });
                message.success('Đánh giá thành công!');
            }
            onSuccess();
            handleClose();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setRating(5);
        setComment('');
        setOrderId(undefined);
        onClose();
    };

    return (
        <Modal
            title={editMode ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
            open={visible}
            onCancel={handleClose}
            footer={[
                <Button key="cancel" onClick={handleClose}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={handleSubmit}
                >
                    {editMode ? 'Cập nhật' : 'Gửi đánh giá'}
                </Button>
            ]}
        >
            <div className="space-y-4">
                {/* Chọn đơn hàng (chỉ khi tạo mới) */}
                {!editMode && (
                    <div>
                        <label className="block mb-2 font-medium">
                            Chọn đơn hàng <span className="text-red-500">*</span>
                        </label>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Chọn đơn hàng đã mua sản phẩm này"
                            value={orderId}
                            onChange={setOrderId}
                            options={userOrders.map(order => ({
                                value: order.order_id,
                                label: `Đơn hàng #${order.order_id} - ${new Date(order.order_date).toLocaleDateString('vi-VN')}`
                            }))}
                        />
                    </div>
                )}

                {/* Đánh giá sao */}
                <div>
                    <label className="block mb-2 font-medium">
                        Đánh giá <span className="text-red-500">*</span>
                    </label>
                    <Rate value={rating} onChange={setRating} />
                </div>

                {/* Nội dung đánh giá */}
                <div>
                    <label className="block mb-2 font-medium">
                        Nhận xét <span className="text-red-500">*</span>
                    </label>
                    <TextArea
                        rows={4}
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={500}
                        showCount
                    />
                </div>
            </div>
        </Modal>
    );
};

export default ReviewForm;