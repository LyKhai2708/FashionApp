import axios from 'axios';
import type {AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import { accessTokenStorage, clearAdminStorage, clearAuthStorage } from './storage';
import authService from '../services/authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

//flag
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

//xu ly req fail trong queue 
const processQueue = (error: any, token: string | null = null ) => {
    failedQueue.forEach(({resolve, reject}) => {
        if(error) {
            reject(error);

        }else{
            resolve(token);
        }
    })

    failedQueue = [];
}

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Check context: đang ở admin panel hay user site
        const isAdminContext = window.location.pathname.startsWith('/admin');
        const token = isAdminContext 
            ? authService.getAdminToken()     
            : authService.getAccessToken();

        if(token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
)

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error) => {
        
        const originalRequest = error.config;
        
        const isLoginEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/admin/login');
        
        if(error.response?.status === 401 && !originalRequest._retry && !isLoginEndpoint) {
            
            if(isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }).catch((err) => {
                    return Promise.reject(err);
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
                // Check context: đang ở admin panel hay user site
                const isAdminContext = window.location.pathname.startsWith('/admin');
                
                let newToken: string;
                
                if (isAdminContext) {
                    newToken = await authService.adminRefreshToken();
                } else {
                    const response = await axios.post(
                        `${API_URL}/api/v1/auth/refresh`,
                        {},
                        { withCredentials: true }
                    );
                    newToken = response.data.data.token;
                    accessTokenStorage.save(newToken);
                }
                
                //process queue
                processQueue(null, newToken);
                
                //retry original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);

            }catch(refreshError: any){

                processQueue(refreshError, null);
                // Check context: đang ở admin panel hay user site
                const isAdminContext = window.location.pathname.startsWith('/admin');
                
                if (isAdminContext) {
                    clearAdminStorage();
                    window.dispatchEvent(new Event('admin:logout'));
                    window.location.href = '/admin/login';
                } else {
                    clearAuthStorage();
                    window.dispatchEvent(new Event('auth:logout'));
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }finally{
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
export default apiClient;

export const api = {
    get: <T = any>(url: string, config?: AxiosRequestConfig) => 
      apiClient.get<T>(url, config),
    
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
      apiClient.post<T>(url, data, config),
    
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
      apiClient.put<T>(url, data, config),
    
    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
      apiClient.patch<T>(url, data, config),
    
    delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
      apiClient.delete<T>(url, config),
};