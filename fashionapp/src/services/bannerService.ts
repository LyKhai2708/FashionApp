import { api } from '../utils/axios';

export interface Banner {
    banner_id: number;
    title: string;
    alt_text?: string;
    image_url: string;
    banner_type: 'promotion' | 'voucher' | 'category' | 'custom';
    promotion_id?: number;
    voucher_id?: number;
    category_id?: number;
    link_url?: string;
    link_target: '_blank' | '_self';
    start_date?: string;
    end_date?: string;
    status: 'draft' | 'active' | 'paused' | 'expired';
    position: string;
    display_order: number;
    created_at: string;
    updated_at: string;
    promotion_name?: string;
    voucher_code?: string;
    voucher_name?: string;
    category_name?: string;
    category_slug?: string;
}

export interface BannersParams {
    page?: number;
    limit?: number;
    status?: string;
    banner_type?: string;
    position?: string;
    start_date?: string;
    end_date?: string;
}

export interface BannersResponse {
    status: 'success';
    data: {
        metadata: {
            totalRecords: number;
            firstPage: number;
            lastPage: number;
            page: number;
            limit: number;
        };
        banners: Banner[];
    };
}

class BannerService {
    
    /**
     * Lấy danh sách banners (Admin)
     */
    async getBanners(params?: BannersParams): Promise<BannersResponse['data']> {
        try {
            const response = await api.get<BannersResponse>('/api/v1/banners', { params });
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching banners:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy danh sách banners');
        }
    }
    
    /**
     * Lấy banner theo ID (Admin)
     */
    async getBannerById(id: number): Promise<Banner> {
        try {
            const response = await api.get(`/api/v1/banners/${id}`);
            return response.data.data.banner;
        } catch (error: any) {
            console.error('Error fetching banner:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy thông tin banner');
        }
    }
    
    /**
     * Tạo banner mới với ảnh (Admin)
     */
    async createBannerWithImage(formData: FormData): Promise<Banner> {
        try {
            const response = await api.post('/api/v1/banners', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.data.banner;
        } catch (error: any) {
            console.error('Create banner error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tạo banner');
        }
    }
    
    /**
     * Cập nhật banner với ảnh (Admin)
     */
    async updateBannerWithImage(id: number, formData: FormData): Promise<Banner> {
        try {
            const response = await api.put(`/api/v1/banners/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.data.banner;
        } catch (error: any) {
            console.error('Update banner error:', error);
            throw new Error(error.response?.data?.message || 'Không thể cập nhật banner');
        }
    }
    
    /**
     * Xóa banner (Admin)
     */
    async deleteBanner(id: number): Promise<void> {
        try {
            await api.delete(`/api/v1/banners/${id}`);
        } catch (error: any) {
            console.error('Delete banner error:', error);
            throw new Error(error.response?.data?.message || 'Không thể xóa banner');
        }
    }
    
    /**
     * Lấy banners active cho slider (Public)
     */
    async getActiveBanners(position: string = 'home-hero'): Promise<Banner[]> {
        try {
            const response = await api.get('/api/v1/banners/public', {
                params: { position }
            });
            return response.data.data.banners;
        } catch (error: any) {
            console.error('Error fetching active banners:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy banners');
        }
    }
}

export const bannerService = new BannerService();
export default bannerService;
