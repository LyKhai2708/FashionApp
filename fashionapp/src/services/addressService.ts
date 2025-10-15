import api from '../utils/axios';

export interface Address {
    id: number;
    user_id: number;
    province: string;
    province_code: number;
    ward: string;
    ward_code: number;
    detail_address: string;
    is_default: boolean;
    receiver_name?: string;
    receiver_phone?: string;
    receiver_email?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateAddressPayload {
    province: string;
    province_code: number;
    ward: string;
    ward_code: number;
    detail_address: string;
    is_default?: boolean;
    receiver_name?: string;
    receiver_phone?: string;
    receiver_email?: string;
}

class AddressService {
    async getUserAddresses(): Promise<Address[]> {
        try {
            const response = await api.get<any>('/api/v1/addresses');
            return response.data.data.addresses;
        } catch (error: any) {
            console.error('Get addresses error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách địa chỉ');
        }
    }

    async getDefaultAddress(): Promise<Address | null> {
        try {
            const response = await api.get<any>('/api/v1/addresses/default');
            return response.data.data.address || null;
        } catch (error: any) {
            console.error('Get default address error:', error);
            return null;
        }
    }

    async createAddress(payload: CreateAddressPayload): Promise<Address> {
        try {
            const response = await api.post<any>('/api/v1/addresses', payload);
            return response.data.data.address;
        } catch (error: any) {
            console.error('Create address error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tạo địa chỉ');
        }
    }

    async updateAddress(id: number, payload: CreateAddressPayload): Promise<Address> {
        try {
            const response = await api.put<any>(`/api/v1/addresses/${id}`, payload);
            return response.data.data.address;
        } catch (error: any) {
            console.error('Update address error:', error);
            throw new Error(error.response?.data?.message || 'Không thể cập nhật địa chỉ');
        }
    }

    async deleteAddress(id: number): Promise<void> {
        try {
            await api.delete(`/api/v1/addresses/${id}`);
        } catch (error: any) {
            console.error('Delete address error:', error);
            throw new Error(error.response?.data?.message || 'Không thể xóa địa chỉ');
        }
    }

    async setDefaultAddress(id: number): Promise<Address> {
        try {
            const response = await api.patch<any>(`/api/v1/addresses/${id}/default`);
            return response.data.data.address;
        } catch (error: any) {
            console.error('Set default address error:', error);
            throw new Error(error.response?.data?.message || 'Không thể đặt địa chỉ mặc định');
        }
    }
}

export default new AddressService();
