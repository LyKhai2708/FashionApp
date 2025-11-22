import api from '../utils/axios';

export interface Role {
    role_id: number;
    role_name: string;
    description?: string;
    user_count?: number;
    permission_count?: number;
}

class RoleService {
    async getRoles(): Promise<Role[]> {
        try {
            const response = await api.get<any>('/api/v1/admin/roles');
            return response.data.data.roles;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách vai trò');
        }
    }

    async getRole(roleId: number): Promise<Role> {
        try {
            const response = await api.get<any>(`/api/v1/admin/roles/${roleId}`);
            return response.data.data.role;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể tải thông tin vai trò');
        }
    }
}

export default new RoleService();
