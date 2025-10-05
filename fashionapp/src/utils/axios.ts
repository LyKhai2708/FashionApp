import axios from 'axios';
import type {AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import { accessTokenStorage, clearAuthStorage } from './storage';

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
        const token = accessTokenStorage.get();

        if(token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
)

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`)
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        if(error.response.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
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
                const response = await axios.post(
                    `${API_URL}/api/v1/auth/refresh`,
                    {},
                    {withCredentials: true}
                )

                const {token} = response.data.data;
                //luu token moi
                accessTokenStorage.save(token);
                
                //process queue
                processQueue(null, token);
                
                //retry original request
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return apiClient(originalRequest);

            }catch(refreshError){
                // Refresh token failed -> dang xuat
                processQueue(refreshError, null);
                
                clearAuthStorage();
                
                window.location.href = '/login';
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