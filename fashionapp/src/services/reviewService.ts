import { api } from '../utils/axios';


export interface Review {
    id: number;
    user_id: number;
    product_id: number;
    order_id: number;
    rating: number;
    comment: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
}

export interface ReviewResponse{
    reviews: Review[];
    metadata: {
        totalRecords: number;
        firstPage: number;
        lastPage: number;
        page: number;
        limit: number;
    };
    average_rating: number;
    total_reviews: number;
}

export interface CreateReviewPayload {
    order_id: number;
    rating: number;
    comment: string;
}


class ReviewService {
    async getProductReviews(productId: number, page: number = 1, limit: number = 5): Promise<ReviewsResponse> {
        try {
            const response = await api.get<any>(`/api/v1/products/${productId}/reviews`, {
                params: { page, limit }
            });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể tải đánh giá');
        }
    }

    async createReview(productId: number, payload: CreateReviewPayload): Promise<void> {
        try {
            await api.post(`/api/v1/products/${productId}/reviews`, payload);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể tạo đánh giá');
        }
    }

    async updateReview(reviewId: number, rating: number, comment: string): Promise<void> {
        try {
            await api.put(`/api/v1/reviews/${reviewId}`, { rating, comment });
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể cập nhật đánh giá');
        }
    }

    async deleteReview(reviewId: number): Promise<void> {
        try {
            await api.delete(`/api/v1/reviews/${reviewId}`);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể xóa đánh giá');
        }
    }
}

export default new ReviewService();