import { api } from '../utils/axios';

export interface Voucher {
    voucher_id: number;
    code: string;
    name: string;
    description?: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
    discount_value: number;
    min_order_amount: number;
    max_discount_amount?: number;
    usage_limit?: number;
    used_count: number;
    user_limit: number;
    start_date: string;
    end_date: string;
    active: boolean;
    remaining_usage?: number;
    user_remaining_usage?: number;
    created_at: string;
    updated_at: string;
}

export interface VoucherValidationRequest {
    order_amount: number;
    shipping_fee?: number;
}

export interface VoucherValidationResponse {
    voucher: {
        voucher_id: number;
        code: string;
        name: string;
        description?: string;
        discount_type: string;
        discount_value: number;
        discount_amount: number;
    };
    order_summary: {
        original_amount: number;
        discount_amount: number;
        final_amount: number;
        shipping_fee: number;
    };
}

export interface VoucherCreateRequest {
    code: string;
    name: string;
    description?: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
    discount_value: number;
    min_order_amount?: number;
    max_discount_amount?: number;
    usage_limit?: number;
    user_limit?: number;
    start_date: string;
    end_date: string;
    active?: boolean;
}

export interface VoucherUpdateRequest {
    name?: string;
    description?: string;
    discount_type?: 'percentage' | 'fixed_amount' | 'free_shipping';
    discount_value?: number;
    min_order_amount?: number;
    max_discount_amount?: number;
    usage_limit?: number;
    user_limit?: number;
    start_date?: string;
    end_date?: string;
    active?: boolean;
}

export interface VoucherParams {
    page?: number;
    limit?: number;
    code?: string;
    name?: string;
    active?: boolean;
    discount_type?: string;
    start_date?: string;
    end_date?: string;
}

export interface VouchersResponse {
    status: 'success';
    data: {
        metadata: {
            totalRecords: number;
            firstPage: number;
            lastPage: number;
            page: number;
            limit: number;
        };
        vouchers: Voucher[];
    };
}

export interface VoucherResponse {
    status: 'success';
    data: {
        voucher: Voucher;
    };
}

class VoucherService {
    /**
     * Lấy danh sách vouchers (Admin)
     */
    async getVouchers(params?: VoucherParams): Promise<VouchersResponse['data']> {
        try {
            const response = await api.get<VouchersResponse>('/api/v1/vouchers/admin', {
                params
            });
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching vouchers:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy danh sách voucher');
        }
    }

    /**
     * Lấy chi tiết voucher theo ID (Admin)
     */
    async getVoucherById(voucherId: number): Promise<Voucher> {
        try {
            const response = await api.get<VoucherResponse>(`/api/v1/vouchers/admin/${voucherId}`);
            return response.data.data.voucher;
        } catch (error: any) {
            console.error('Error fetching voucher:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy thông tin voucher');
        }
    }

    /**
     * Tạo voucher mới (Admin)
     */
    async createVoucher(data: VoucherCreateRequest): Promise<Voucher> {
        try {
            const response = await api.post<VoucherResponse>('/api/v1/vouchers/admin', data);
            return response.data.data.voucher;
        } catch (error: any) {
            console.error('Error creating voucher:', error);
            throw new Error(error.response?.data?.message || 'Không thể tạo voucher');
        }
    }

    /**
     * Cập nhật voucher (Admin)
     */
    async updateVoucher(voucherId: number, data: VoucherUpdateRequest): Promise<Voucher> {
        try {
            const response = await api.patch<VoucherResponse>(`/api/v1/vouchers/admin/${voucherId}`, data);
            return response.data.data.voucher;
        } catch (error: any) {
            console.error('Error updating voucher:', error);
            throw new Error(error.response?.data?.message || 'Không thể cập nhật voucher');
        }
    }

    /**
     * Xóa voucher (Admin)
     */
    async deleteVoucher(voucherId: number): Promise<{ success: boolean }> {
        try {
            const response = await api.delete<{ status: 'success'; data: { success: boolean } }>(
                `/api/v1/vouchers/admin/${voucherId}`
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error deleting voucher:', error);
            throw new Error(error.response?.data?.message || 'Không thể xóa voucher');
        }
    }

    /**
     * Lấy danh sách vouchers có sẵn cho user
     */
    async getAvailableVouchers(orderAmount?: number): Promise<Voucher[]> {
        try {
            const params = orderAmount ? { order_amount: orderAmount } : {};
            const response = await api.get<{ status: 'success'; data: { vouchers: Voucher[] } }>(
                '/api/v1/vouchers/available',
                { params }
            );
            return response.data.data.vouchers;
        } catch (error: any) {
            console.error('Error fetching available vouchers:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy danh sách voucher có sẵn');
        }
    }

    /**
     * Validate và áp dụng voucher
     */
    async validateVoucher(code: string, orderAmount: number, shippingFee?: number): Promise<VoucherValidationResponse> {
        try {
            const response = await api.post<{ status: 'success'; data: VoucherValidationResponse }>(
                `/api/v1/vouchers/validate/${code}`,
                {
                    order_amount: orderAmount,
                    shipping_fee: shippingFee || 0
                }
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error validating voucher:', error);
            throw new Error(error.response?.data?.message || 'Voucher không hợp lệ');
        }
    }

    /**
     * Lấy lịch sử sử dụng voucher của user
     */
    async getUserVoucherHistory(page: number = 1, limit: number = 10): Promise<{
        metadata: {
            totalRecords: number;
            firstPage: number;
            lastPage: number;
            page: number;
            limit: number;
        };
        vouchers: Array<{
            voucher_id: number;
            code: string;
            name: string;
            description?: string;
            discount_type: string;
            discount_value: number;
            used_count: number;
            first_used_at: string;
            last_used_at: string;
        }>;
    }> {
        try {
            const response = await api.get<{
                status: 'success';
                data: {
                    metadata: any;
                    vouchers: any[];
                };
            }>('/api/v1/vouchers/history', {
                params: { page, limit }
            });
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching voucher history:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy lịch sử sử dụng voucher');
        }
    }

    /**
     * Tính số tiền giảm giá của voucher (client-side calculation)
     */
    calculateVoucherDiscount(voucher: Voucher, orderAmount: number, shippingFee: number = 0): number {
        let discountAmount = 0;

        switch (voucher.discount_type) {
            case 'percentage':
                discountAmount = orderAmount * (voucher.discount_value / 100);
                if (voucher.max_discount_amount && discountAmount > voucher.max_discount_amount) {
                    discountAmount = voucher.max_discount_amount;
                }
                break;

            case 'fixed_amount':
                discountAmount = voucher.discount_value;
                if (discountAmount > orderAmount) {
                    discountAmount = orderAmount;
                }
                break;

            case 'free_shipping':
                discountAmount = shippingFee;
                break;
        }

        return Math.round(discountAmount);
    }

    /**
     * Kiểm tra voucher có hợp lệ không (client-side validation)
     */
    isVoucherValid(voucher: Voucher, orderAmount: number): {
        isValid: boolean;
        reason?: string;
    } {
        const now = new Date();
        const startDate = new Date(voucher.start_date);
        const endDate = new Date(voucher.end_date);
        endDate.setHours(23, 59, 59, 999);

        if (!voucher.active) {
            return { isValid: false, reason: 'Voucher đã hết hiệu lực' };
        }

        if (now < startDate || now > endDate) {
            return { isValid: false, reason: 'Voucher không nằm trong thời gian hiệu lực' };
        }

        if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
            return { isValid: false, reason: 'Voucher đã hết lượt sử dụng' };
        }

        if (orderAmount < voucher.min_order_amount) {
            return {
                isValid: false,
                reason: `Đơn hàng tối thiểu phải đạt ${voucher.min_order_amount.toLocaleString('vi-VN')} VNĐ để sử dụng voucher này`
            };
        }

        return { isValid: true };
    }

    /**
     * Format discount type text
     */
    formatDiscountType(discountType: string): string {
        switch (discountType) {
            case 'percentage':
                return 'Giảm theo %';
            case 'fixed_amount':
                return 'Giảm cố định';
            case 'free_shipping':
                return 'Miễn phí vận chuyển';
            default:
                return discountType;
        }
    }

    /**
     * Format discount value text
     */
    formatDiscountValue(voucher: Voucher): string {
        switch (voucher.discount_type) {
            case 'percentage':
                return `Giảm ${voucher.discount_value}%`;
            case 'fixed_amount':
                return `Giảm ${voucher.discount_value.toLocaleString('vi-VN')} VNĐ`;
            case 'free_shipping':
                return 'Miễn phí vận chuyển';
            default:
                return '';
        }
    }

    /**
     * Tính số ngày còn lại của voucher
     */
    getDaysLeft(endDate: string): number {
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Format ngày tháng
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
export const voucherService = new VoucherService();
export default voucherService;