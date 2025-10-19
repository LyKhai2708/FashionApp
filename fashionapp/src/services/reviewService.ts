import { api } from '../utils/axios';


export interface Review {
    id: number;
    user_id: number;
    product_id: number;
    order_id: number;
    rating: number;
    comment: string;
    created_at: string;
    updated_at?: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    is_verified_purchase: boolean;
}

export interface ReviewStats {
    average_rating: number;
    total_reviews: number;
    rating_breakdown: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

export interface ReviewsResponse {
    status: string;
    data: {
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
        rating_breakdown: {
            1: number;
            2: number;
            3: number;
            4: number;
            5: number;
        };
    };
}

export interface CreateReviewPayload {
    order_id: number;
    rating: number;
    comment: string;
}

export interface UpdateReviewPayload {
    rating: number;
    comment: string;
}


class ReviewService {
    async getProductReviews(productId: number, page: number = 1, limit: number = 5, sortBy: string = 'newest',
        filterRating: number = 0): Promise<ReviewsResponse> {
        try {
            const response = await api.get<any>(`/api/v1/reviews/products/${productId}`, {
                params: { page, limit, sortBy, filterRating }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể tải đánh giá');
        }
    }

    async createReview(productId: number, payload: CreateReviewPayload): Promise<void> {
        try {
            await api.post(`/api/v1/reviews/products/${productId}`, payload);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể tạo đánh giá');
        }
    }

    async updateReview(reviewId: number, data: UpdateReviewPayload): Promise<void> {
        try {
            await api.put(`/api/v1/reviews/${reviewId}`, data);
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

    async getEligibleOrdersForReview(productId: number) {
        try {
            const response = await api.get<any>(`/api/v1/orders/product/${productId}/reviews`);
            return response.data.data.orders;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể tải đơn hàng');
        }
    }

    async checkReviewed(productId: number, orderId: number): Promise<boolean> {
        try {
            const response = await api.get<any>(`/api/v1/reviews/reviewCheck/product/${productId}/order/${orderId}`);
            return response.data?.data?.reviewed === true;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể kiểm tra đánh giá');
        }
    }

    async getMyReview(productId: number, orderId: number) {
        try {
            const response = await api.get<any>(`/api/v1/reviews/my/product/${productId}/order/${orderId}`);
            return response.data?.data?.review || null;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể lấy đánh giá của bạn');
        }
    }
}

export default new ReviewService();