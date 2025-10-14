import { api } from '../utils/axios';
import type { Product } from '../types/product';

// ==================== INTERFACES ====================

export interface Promotion {
    promo_id: number;
    name: string;
    description?: string;
    discount_percent: number;
    start_date: string;
    end_date: string;
    active: boolean;
    product_count?: number;
    created_at?: string;
}

export interface PromotionsParams {
    page?: number;
    limit?: number;
    promo_name?: string;
    active?: boolean;
    start_date?: string;
    end_date?: string;
}

export interface PromotionProductsParams {
    page?: number;
    limit?: number;
}

export interface PromotionsResponse {
    status: 'success';
    data: {
        metadata: {
            totalRecords: number;
            firstPage: number;
            lastPage: number;
            page: number;
            limit: number;
        };
        promotions: Promotion[];
    };
}

export interface PromotionProductsResponse {
    status: 'success';
    data: {
        metadata: {
            totalRecords: number;
            firstPage: number;
            lastPage: number;
            page: number;
            limit: number;
        };
        products: Product[];
    };
}


class PromotionService {

    async getPromotions(params?: PromotionsParams): Promise<PromotionsResponse['data']> {
        try {
            const response = await api.get<PromotionsResponse>('/api/v1/promotions', { 
                params 
            });
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching promotions:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy danh sách khuyến mãi');
        }
    }

    async getActivePromotions(limit: number = 10): Promise<Promotion[]> {
        try {
            const response = await this.getPromotions({ 
                active: true, 
                limit 
            });
            return response.promotions;
        } catch (error) {
            console.error('Error fetching active promotions:', error);
            throw error;
        }
    }


    async getCurrentPromotions(limit: number = 10): Promise<Promotion[]> {
        try {
            const response = await this.getPromotions({ 
                active: true, 
                limit: 50 // Lấy nhiều hơn để filter phía client
            });
            
            // Filter promotions đang trong khoảng thời gian
            const now = new Date();
            const currentPromotions = response.promotions.filter(promo => {
                const start = new Date(promo.start_date);
                const end = new Date(promo.end_date);
                const isInRange = now >= start && now <= end;
                console.log(`  - ${promo.name}: ${promo.start_date} to ${promo.end_date} → ${isInRange ? '✅' : '❌'}`);
                return isInRange;
            });
            
            // Limit kết quả
            const result = currentPromotions.slice(0, limit);
            return result;
        } catch (error) {
            console.error('Error fetching current promotions:', error);
            throw error;
        }
    }

    async getPromotionById(promoId: number): Promise<Promotion> {
        try {
            const response = await api.get<{ status: 'success'; data: { promotion: Promotion } }>(
                `/api/v1/promotions/${promoId}`
            );
            return response.data.data.promotion;
        } catch (error: any) {
            console.error('Error fetching promotion:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy thông tin khuyến mãi');
        }
    }
    async getPromotionProducts(
        promoId: number, 
        params?: PromotionProductsParams
    ): Promise<PromotionProductsResponse['data']> {
        try {
            const response = await api.get<PromotionProductsResponse>(
                `/api/v1/promotions/${promoId}/products`,
                { params }
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching promotion products:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy sản phẩm khuyến mãi');
        }
    }
    async addProductToPromotion(promoId: number, productId: number): Promise<{ success: boolean }> {
        try {
            const response = await api.post<{ status: 'success'; data: { success: boolean } }>(
                `/api/v1/promotions/${promoId}/products/${productId}`
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error adding product to promotion:', error);
            throw new Error(
                error.response?.data?.message || 'Không thể thêm sản phẩm vào khuyến mãi'
            );
        }
    }
    async removeProductFromPromotion(promoId: number, productId: number): Promise<{ success: boolean }> {
        try {
            const response = await api.delete<{ status: 'success'; data: { success: boolean } }>(
                `/api/v1/promotions/${promoId}/products/${productId}`
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error removing product from promotion:', error);
            throw new Error(
                error.response?.data?.message || 'Không thể xóa sản phẩm khỏi khuyến mãi'
            );
        }
    }
    async createPromotion(data: {
        name: string;
        description?: string;
        discount_percent: number;
        start_date: string;
        end_date: string;
        active?: boolean;
    }): Promise<Promotion> {
        try {
            const response = await api.post<{ status: 'success'; data: { promotion: Promotion } }>(
                '/api/v1/promotions',
                data
            );
            return response.data.data.promotion;
        } catch (error: any) {
            console.error('Error creating promotion:', error);
            throw new Error(
                error.response?.data?.message || 'Không thể tạo khuyến mãi'
            );
        }
    }
    async updatePromotion(
        promoId: number, 
        data: Partial<{
            name: string;
            description: string;
            discount_percent: number;
            start_date: string;
            end_date: string;
            active: boolean;
        }>
    ): Promise<Promotion> {
        try {
            const response = await api.patch<{ status: 'success'; data: { promotion: Promotion } }>(
                `/api/v1/promotions/${promoId}`,
                data
            );
            return response.data.data.promotion;
        } catch (error: any) {
            console.error('Error updating promotion:', error);
            throw new Error(
                error.response?.data?.message || 'Không thể cập nhật khuyến mãi'
            );
        }
    }

    /**
     * Deactivate promotion (Admin only)
     * @param promoId - ID của promotion
     * @returns Promise<{ success: boolean }>
     */
    async deactivatePromotion(promoId: number): Promise<{ success: boolean }> {
        try {
            const response = await api.patch<{ status: 'success'; data: { success: boolean } }>(
                `/api/v1/promotions/${promoId}/deactivate`
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error deactivating promotion:', error);
            throw new Error(
                error.response?.data?.message || 'Không thể vô hiệu hóa khuyến mãi'
            );
        }
    }

    /**
     * Xóa promotion (Admin only)
     * @param promoId - ID của promotion
     * @returns Promise<{ success: boolean }>
     */
    async deletePromotion(promoId: number): Promise<{ success: boolean }> {
        try {
            const response = await api.delete<{ status: 'success'; data: { success: boolean } }>(
                `/api/v1/promotions/${promoId}`
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error deleting promotion:', error);
            throw new Error(
                error.response?.data?.message || 'Không thể xóa khuyến mãi'
            );
        }
    }

    /**
     * Tính số ngày còn lại của promotion
     * @param endDate - Ngày kết thúc
     * @returns number
     */
    getDaysLeft(endDate: string): number {
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Kiểm tra promotion có đang active không
     * @param promotion - Promotion object
     * @returns boolean
     */
    isPromotionActive(promotion: Promotion): boolean {
        if (!promotion.active) return false;
        
        const now = new Date();
        const start = new Date(promotion.start_date);
        const end = new Date(promotion.end_date);
        
        return now >= start && now <= end;
    }

    /**
     * Format ngày tháng
     * @param date - Date string
     * @returns string
     */
    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// Export singleton instance
export const promotionService = new PromotionService();
export default promotionService;
