
import api from '../utils/axios';

export interface OtpResponse {
    success: boolean;
    message: string;
    data?: {
        expiresAt?: string;
        phoneVerified?: boolean;
    };
}

class OtpService {
    async sendOtp(phone: string): Promise<OtpResponse> {
        try {
            const response = await api.post<OtpResponse>('/api/v1/otp/OtpSend', { phone });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể gửi OTP');
        }
    }

    async verifyOtp(phone: string, otp: string): Promise<OtpResponse> {
        try {
            const response = await api.post<OtpResponse>('/api/v1/otp/OtpVerify', { 
                phone, 
                otp 
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Xác thực OTP thất bại');
        }
    }
}

export default new OtpService();