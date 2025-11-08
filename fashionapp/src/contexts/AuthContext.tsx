import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {LoginRequest, RegisterRequest } from '../types/auth';
import type { AuthContextType } from '../types/auth';
import { authReducer, initialState } from '../services/authReducer';
import { authService } from '../services/authService';
import { 
  LOGIN_START, 
  LOGIN_SUCCESS, 
  LOGIN_FAILURE,
  REGISTER_START,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  LOGOUT,
  REFRESH_TOKEN_SUCCESS,
  CLEAR_ERROR 
} from '../services/authActions';


const AuthContext = createContext<AuthContextType | undefined>(undefined);


//custom hook 
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


interface AuthProviderProps{
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const login = async (credentials: LoginRequest): Promise<void> => {
        try {
            dispatch({ type: LOGIN_START });
            const { user, token } = await authService.login(credentials);
            dispatch({ type: LOGIN_SUCCESS, payload: { user, token } });
        } catch (error: any) {
            dispatch
            ({ 
                type: LOGIN_FAILURE, payload: { error: error.message } 
            });
            throw error;
        };
        
    }

    const googleLogin = async (idToken: string): Promise<void> => {
        try {
            dispatch({ type: LOGIN_START });
            const { user, token } = await authService.googleLogin(idToken);
            dispatch({ type: LOGIN_SUCCESS, payload: { user, token } });
        } catch (error: any) {
            dispatch({ 
                type: LOGIN_FAILURE, 
                payload: { error: error.message } 
            });
            throw error;
        }
    }

    const register = async (userData: RegisterRequest): Promise<void> => {
        dispatch({ type: REGISTER_START });
        try {
            await authService.register(userData);

            dispatch({ type: REGISTER_SUCCESS });

        } catch (error: any) {
            dispatch
            ({ 
                type: REGISTER_FAILURE, 
                payload: { error: error.message } 
            });
            throw error;
        };
    }

    const logout = async (): Promise<void> => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          dispatch({ type: LOGOUT });
        }
    };

    const refreshToken = useCallback(async (): Promise<void> => {
        try{
            const newToken = await authService.refreshToken();
            
            dispatch({ type: REFRESH_TOKEN_SUCCESS,
                 payload: { token: newToken } });
        }
        catch(error){
            dispatch({ type: LOGOUT });
            throw error;
        }
    }, []);

    const clearError = (): void => {
        dispatch({ type: CLEAR_ERROR });
    }

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;
    
        if (state.isAuthenticated) {
          
          intervalId = setInterval(async () => {
            if (authService.getCurrentUser()) {
              try {
                console.log('start refresh');
                await refreshToken();
              } catch (error: any) {
                console.log(' Auto-refresh failed:', error.message);
              }
            } else {
              if (intervalId) clearInterval(intervalId);
            }
          }, 720000); 
        } else {
          if (intervalId) clearInterval(intervalId);
        }
        return () => {
          if (intervalId) clearInterval(intervalId);
        };
      }, [state.isAuthenticated, refreshToken]);

    useEffect(() => {
        const user = authService.getCurrentUser();
        const token = authService.getAccessToken();
        
        if (user && token) {
          dispatch({ 
            type: LOGIN_SUCCESS, 
            payload: { user, token } 
          });
        }

        const handleLogout = () => {
          dispatch({ type: LOGOUT });
        };

        window.addEventListener('auth:logout', handleLogout);

        return () => {
          window.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

    const contextValue: AuthContextType = {
        ...state,
        login,
        googleLogin,
        register,
        logout,
        refreshToken,
        clearError,
      } as AuthContextType;
    
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};