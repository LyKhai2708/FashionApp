import api from '../utils/axios';

export interface EmailVerificationResponse {
    success: boolean;
    message: string;
    data?: {
        expiresAt?: string;
        emailVerified?: boolean;
        email?: string;
        purpose?: string;
    };
}

class EmailVerificationService {

    async sendVerificationRegister(email: string): Promise<EmailVerificationResponse> {
        try {
            const response = await api.post<EmailVerificationResponse>(
                '/api/v1/email-verifications',
                { email }
            );
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể gửi email xác nhận');
        }
    }


    async verifyToken(token: string): Promise<EmailVerificationResponse> {
        try {
            const response = await api.patch<EmailVerificationResponse>(
                `/api/v1/email-verifications/${token}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Xác thực email thất bại');
        }
    }


    async sendVerificationChangeEmail(newEmail: string, password: string): Promise<EmailVerificationResponse> {
        try {
            const response = await api.post<EmailVerificationResponse>(
                '/api/v1/email-verifications/change-email',
                { newEmail, password }
            );
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Không thể gửi email xác nhận');
        }
    }
}

export default new EmailVerificationService();
