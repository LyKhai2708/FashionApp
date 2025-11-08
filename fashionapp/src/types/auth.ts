export interface UserEntity {
    user_id: number;
    username: string;
    email: string;
    phone?: string;
    address?: string;
    role: 'customer' | 'admin';
    created_at: string;
    del_flag?: boolean;
}

export interface User {
    id: number;
    username: string;
    email: string;
    role: 'customer' | 'admin';
    phone?: string | null;
    address?: string;
    auth_provider?: 'local' | 'google';
    google_id?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    phone: string;
}

export interface AuthResponse {
    status: 'success';
    data: {
      user: User;
      token: string;
    };
}

export interface AuthError {
    status: 'error' | 'fail';
    message: string;
    data?: any;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface AuthContextType extends AuthState {
    login: (credentials: LoginRequest) => Promise<void>;
    googleLogin: (idToken: string) => Promise<void>;
    register: (userData: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    clearError: () => void;
}