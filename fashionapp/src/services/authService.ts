import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';
import { accessTokenStorage, userStorage, clearAuthStorage, adminTokenStorage, adminUserStorage, clearAdminStorage } from '../utils/storage';
import { api } from '../utils/axios';

export type AuthContext = 'user' | 'admin';

class AuthService {
  
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<AuthResponse>('/api/v1/auth/login', credentials);
      
      const { user, token } = response.data.data;
      console.log(response.data.data);

      accessTokenStorage.save(token);
      userStorage.save(user);
      
      return { user, token };
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.data || error.response?.data?.message || 'Đăng nhập thất bại';
      throw new Error(errorMessage);
    }
  }

  async googleLogin(idToken: string): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<AuthResponse>('/api/v1/auth/google', { idToken });
      
      const { user, token } = response.data.data;
      console.log('Google login response:', response.data.data);

      accessTokenStorage.save(token);
      userStorage.save(user);
      
      return { user, token };
      
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Đăng nhập Google thất bại');
    }
  }


  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
        const response = await api.post<AuthResponse>('/api/v1/auth/register', data);
        console.log(response.data.data.token);
        if (response.data.data?.token) {
            accessTokenStorage.save(response.data.data.token);
            userStorage.save(response.data.data.user);
        }
        
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
    }
}

  async logout(): Promise<void> {
    try {

      await api.post('/api/v1/auth/logout');
      
    } catch (error) {

      console.error('Logout API error:', error);
    } finally {

      clearAuthStorage();
    }
  }

  async refreshToken(): Promise<string> {
    console.log('call refreshToken');
    try {
      const response = await api.post<AuthResponse>('/api/v1/auth/refresh', {}, {
        withCredentials: true
      });
      
      const { token } = response.data.data;
      console.log(token);
      
      accessTokenStorage.save(token);
      
      return token;
      
    } catch (error: any) {
      console.error('Refresh token error:', error);
      clearAuthStorage();
      throw new Error('Phiên đăng nhập hết hạn');
    }
  }


  getCurrentUser(): User | null {
    return userStorage.get();
  }

  getAccessToken(): string | null {
    return accessTokenStorage.get();
  }

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = this.getAccessToken();
    return !!(user && token);
  }

  async getUserProfile(): Promise<User> {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('Chưa đăng nhập');
      
      const response = await api.get<{ data: User }>(`/api/v1/users/${user.id}`);
      
      userStorage.save(response.data.data);
      
      return response.data.data;
      
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể lấy thông tin user');
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('Chưa đăng nhập');
      
      const response = await api.patch<{ data: User }>(`/api/v1/users/${user.id}`, userData);
      

      userStorage.save(response.data.data);
      
      return response.data.data;
      
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Cập nhật thông tin thất bại');
    }
  }


  async adminLogin(credentials: LoginRequest): Promise<{user: User; token: string}> {
    try {
      const response = await api.post<AuthResponse>('/api/v1/admin/login', credentials);
      
      const { user, token } = response.data.data;
      console.log('Admin login:', response.data.data);

      adminTokenStorage.save(token);
      adminUserStorage.save(user);
      
      return { user, token };
      
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  }

  async adminLogout(): Promise<void> {
        try {
            await api.post('/api/v1/admin/logout');
        } catch (error) {
            console.error('Admin logout API error:', error);
        } finally {
            clearAdminStorage();
        }
  }

  async adminRefreshToken(): Promise<string> {
        console.log('admin refresh token');
        try {
            const response = await api.post<AuthResponse>('/api/v1/admin/refresh', {}, {
                withCredentials: true
            });
            
            const { token } = response.data.data;
            console.log('New admin token:', token);
            
            adminTokenStorage.save(token);
            
            return token;
            
        } catch (error: any) {
            console.error('Admin refresh token error:', error);
            clearAdminStorage();
            throw new Error('Phiên đăng nhập admin hết hạn');
        }
    }
    getCurrentAdmin(): User | null {
        return adminUserStorage.get();
    }


    getAdminToken(): string | null {
        return adminTokenStorage.get();
    }

    isAdminAuthenticated(): boolean {
        const admin = this.getCurrentAdmin();
        const token = this.getAdminToken();
        return !!(admin && token && admin.role === 'admin');
    }


    getCurrentContext(): 'user' | 'admin' | null {
        if (this.isAdminAuthenticated()) return 'admin';
        if (this.isAuthenticated()) return 'user';
        return null;
    }
}

export  const authService = new AuthService();
export default authService;