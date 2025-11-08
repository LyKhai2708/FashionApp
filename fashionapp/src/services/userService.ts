import api from '../utils/axios';

export interface User {
    user_id: number;
    username: string;
    email: string;
    phone?: string;
    role: string;
    is_active?: number;
    created_at: string;
    has_password?: boolean;
}

export interface UpdateUserPayload {
    username?: string;
    email?: string;
    phone?: string;
}

class UserService {
    async getUserById(userId: number): Promise<User> {
        try {
            const response = await api.get<any>(`/api/v1/users/${userId}`);
            return response.data.data.user;
        } catch (error: any) {
            console.error('Get user error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải thông tin người dùng');
        }
    }

    async updateUser(userId: number, payload: UpdateUserPayload): Promise<User> {
        try {
            const response = await api.patch<any>(`/api/v1/users/${userId}`, payload);
            return response.data.data.user;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể cập nhật thông tin');
        }
    }

    async getAllUsers(params?: {
        page?: number;
        limit?: number;
        name?: string;
        email?: string;
        phone?: string;
        role?: string;
        is_active?: number;
    }): Promise<{ users: User[]; metadata: any }> {
        try {
            const response = await api.get<any>('/api/v1/users', { params });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách người dùng');
        }
    }

    async toggleUserStatus(userId: number, is_active: number): Promise<User> {
        try {
            const response = await api.patch<any>(`/api/v1/users/${userId}`, { is_active });
            return response.data.data.user;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
        }
    }

    async disableUser(userId: number): Promise<void> {
        try {
            await api.delete<any>(`/api/v1/users/${userId}`);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể vô hiệu hóa người dùng');
        }
    }

    async sendPhoneOtp(phone: string): Promise<{ message: string; expiresAt: string }> {
        try {
            const response = await api.post<any>('/api/v1/otp/sendAddPhoneOtp', { phone });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể gửi OTP');
        }
    }

    async verifyPhone(phone: string, otp: string): Promise<User> {
        try {
            const response = await api.post<any>('/api/v1/otp/verifyAddPhone', { phone, otp });
            return response.data.data.user;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Xác thực OTP thất bại');
        }
    }
}

export const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
        const response = await api.patch<any>('/api/v1/users/password', {
            currentPassword,
            newPassword
        });
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại';
        throw new Error(errorMessage);
    }
};

export default new UserService();
