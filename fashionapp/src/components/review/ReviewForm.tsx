import React, { useState } from 'react';
import { Modal, Rate, Input, Button, Select, message, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import reviewService from '../../services/reviewService';
import { getImageUrl } from '../../utils/imageHelper';

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
        images?: Array<{
            image_id: number;
            image_url: string;
        }>;
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
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>(initialData?.images?.map(image => ({
        uid: image.image_id.toString(),
        name: image.image_url,
        status: 'done',
        url: getImageUrl(image.image_url),
    })) || []);

    const doSubmit = async () => {
        if (!editMode && !orderId) {
            message.error('Please select an order');
            return;
        }

        if (!comment.trim()) {
            message.error('Please enter review content');
            return;
        }

        setLoading(true);
        try {
            const images = fileList
                .filter(file => file.originFileObj)
                .map(file => file.originFileObj as File);

            if (editMode && reviewId) {
                await reviewService.updateReview(reviewId, { rating, comment, images });
                message.success('Review updated successfully!');
            } else {
                await reviewService.createReview(productId, {
                    order_id: orderId!,
                    rating,
                    comment,
                    images
                });
                message.success('Review submitted successfully!');
            }
            handleClose();
            onSuccess();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (editMode && reviewId) {
            setConfirmVisible(true);
            return;
        }
        await doSubmit();
    };

    const handleClose = () => {
        setRating(5);
        setComment('');
        setOrderId(undefined);
        setFileList([]);
        onClose();
    };

    const uploadProps: UploadProps = {
        listType: 'picture-card',
        fileList: fileList,
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Only image files can be uploaded!');
                return Upload.LIST_IGNORE;
            }

            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Image must be smaller than 5MB!');
                return Upload.LIST_IGNORE;
            }

            if (fileList.length >= 5) {
                message.error('Maximum 5 images allowed!');
                return Upload.LIST_IGNORE;
            }

            return false;
        },
        onChange: ({ fileList: newFileList }) => {
            setFileList(newFileList);
        },
        onPreview: async (file) => {
            let src = file.url as string;
            if (!src && file.originFileObj) {
                src = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file.originFileObj as File);
                    reader.onload = () => resolve(reader.result as string);
                });
            }
            const image = new Image();
            image.src = src;
            const imgWindow = window.open(src);
            imgWindow?.document.write(image.outerHTML);
        },
    };

    return (
        <>
            <Modal
                title={editMode ? 'Edit Review' : 'Write a Review'}
                open={visible}
                onCancel={handleClose}
                footer={[
                    <Button key="cancel" onClick={handleClose}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={loading}
                        onClick={handleSubmit}
                    >
                        {editMode ? 'Update' : 'Submit Review'}
                    </Button>
                ]}
            >
                <div className="space-y-4">

                    {!editMode && orderId === undefined && (
                        <div>
                            <label className="block mb-2 font-medium">
                                Select Order <span className="text-red-500">*</span>
                            </label>
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Select order that purchased this product"
                                value={orderId}
                                onChange={setOrderId}
                                options={userOrders.map(order => ({
                                    value: order.order_id,
                                    label: `Order #${order.order_id} - ${new Date(order.order_date).toLocaleDateString('vi-VN')}`
                                }))}
                            />
                        </div>
                    )}

                    {/* Rating */}
                    <div>
                        <label className="block mb-2 font-medium">
                            Rating <span className="text-red-500">*</span>
                        </label>
                        <Rate value={rating} onChange={setRating} />
                    </div>

                    {/* Review content */}
                    <div>
                        <label className="block mb-2 font-medium">
                            Comment <span className="text-red-500">*</span>
                        </label>
                        <TextArea
                            rows={4}
                            placeholder="Share your experience about this product..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={500}
                            showCount
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">
                            Images (Optional)
                        </label>
                        <Upload {...uploadProps}>
                            {fileList.length >= 5 ? null : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            )}
                        </Upload>
                        <p className="text-sm text-gray-500 mt-2">
                            {editMode
                                ? 'Uploading new images will replace all old images. Max 5 images, each up to 5MB'
                                : 'Max 5 images, each up to 5MB'
                            }
                        </p>
                    </div>
                </div>
            </Modal>

            <Modal
                title="Confirm Edit Review"
                open={confirmVisible}
                onCancel={() => setConfirmVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setConfirmVisible(false)}>Cancel</Button>,
                    <Button key="ok" type="primary" loading={loading} onClick={async () => { await doSubmit(); setConfirmVisible(false); }}>Confirm</Button>
                ]}
            >
                After editing, you won't be able to edit again. Are you sure you want to edit?
            </Modal>
        </>
    );
};

export default ReviewForm;