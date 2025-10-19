import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { LoginRequest } from '../../types/auth';
import type { User } from '../../types/auth';
import { authService } from '../../services/authService';

interface AdminAuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

type AdminAuthAction =
    | { type: 'ADMIN_LOGIN_START' }
    | { type: 'ADMIN_LOGIN_SUCCESS'; payload: { user: User; token: string } }
    | { type: 'ADMIN_LOGIN_FAILURE'; payload: { error: string } }
    | { type: 'ADMIN_LOGOUT' }
    | { type: 'ADMIN_REFRESH_TOKEN_SUCCESS'; payload: { token: string } }
    | { type: 'ADMIN_CLEAR_ERROR' };


const initialState: AdminAuthState = {
    user: authService.getCurrentAdmin(),
    token: authService.getAdminToken(),
    isAuthenticated: authService.isAdminAuthenticated(),
    isLoading: false,
    error: null,
};

const adminAuthReducer = (state: AdminAuthState, action: AdminAuthAction): AdminAuthState => {
    switch (action.type) {
        case 'ADMIN_LOGIN_START':
            return { ...state, isLoading: true, error: null };
        
        case 'ADMIN_LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        
        case 'ADMIN_LOGIN_FAILURE':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload.error,
            };
        
        case 'ADMIN_LOGOUT':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };
        
        case 'ADMIN_REFRESH_TOKEN_SUCCESS':
            return {
                ...state,
                token: action.payload.token,
            };
        
        case 'ADMIN_CLEAR_ERROR':
            return { ...state, error: null };
        
        default:
            return state;
    }
};


interface AdminAuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);


export const useAdminAuth = (): AdminAuthContextType => {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};

interface AdminAuthProviderProps {
    children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(adminAuthReducer, initialState);

    const login = async (credentials: LoginRequest): Promise<void> => {
        try {
            dispatch({ type: 'ADMIN_LOGIN_START' });
            const { user, token } = await authService.adminLogin(credentials);
            dispatch({ type: 'ADMIN_LOGIN_SUCCESS', payload: { user, token } });
        } catch (error: any) {
            dispatch({ type: 'ADMIN_LOGIN_FAILURE', payload: { error: error.message } });
            throw error;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await authService.adminLogout();
        } catch (error) {
            console.error('Admin logout error:', error);
        } finally {
            dispatch({ type: 'ADMIN_LOGOUT' });
        }
    };

    const refreshToken = async (): Promise<void> => {
        try {
            const newToken = await authService.adminRefreshToken();
            dispatch({ type: 'ADMIN_REFRESH_TOKEN_SUCCESS', payload: { token: newToken } });
        } catch (error) {
            dispatch({ type: 'ADMIN_LOGOUT' });
            throw error;
        }
    };

    const clearError = (): void => {
        dispatch({ type: 'ADMIN_CLEAR_ERROR' });
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;

        if (state.isAuthenticated) {
            intervalId = setInterval(async () => {
                if (authService.getCurrentAdmin()) {
                    try {
                        await refreshToken();
                    } catch (error: any) {
                        console.log('Admin auto-refresh failed:', error.message);
                    }
                } else {
                    if (intervalId) clearInterval(intervalId);
                }
            }, 600000);
        } else {
            if (intervalId) clearInterval(intervalId);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [state.isAuthenticated]);

    // Initialize from storage
    useEffect(() => {
        const admin = authService.getCurrentAdmin();
        const token = authService.getAdminToken();
        
        if (admin && token) {
            dispatch({ 
                type: 'ADMIN_LOGIN_SUCCESS', 
                payload: { user: admin, token } 
            });
        }

        const handleLogout = () => {
            dispatch({ type: 'ADMIN_LOGOUT' });
        };

        window.addEventListener('admin:logout', handleLogout);

        return () => {
            window.removeEventListener('admin:logout', handleLogout);
        };
    }, []);

    const contextValue: AdminAuthContextType = {
        ...state,
        login,
        logout,
        refreshToken,
        clearError,
    };

    return (
        <AdminAuthContext.Provider value={contextValue}>
            {children}
        </AdminAuthContext.Provider>
    );
};