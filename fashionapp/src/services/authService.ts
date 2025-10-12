import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';
import { accessTokenStorage, userStorage, clearAuthStorage } from '../utils/storage';
import { api } from '../utils/axios';

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
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
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
}

export  const authService = new AuthService();
export default authService;