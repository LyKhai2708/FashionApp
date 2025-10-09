import api from '../utils/axios';

export interface User {
    user_id: number;
    username: string;
    email: string;
    phone?: string;
    role: string;
    created_at: string;
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
