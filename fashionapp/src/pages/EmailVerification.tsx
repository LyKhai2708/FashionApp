import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Result, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import emailVerificationService from '../services/emailVerificationService';

export default function EmailVerification() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [purpose, setPurpose] = useState<string>('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Token xác nhận không hợp lệ');
                return;
            }

            try {
                const response = await emailVerificationService.verifyToken(token);
                setStatus('success');
                setMessage(response.message || 'Email đã được xác nhận thành công!');
                setEmail(response.data?.email || '');
                setPurpose(response.data?.purpose || '');

                //save to localStorage
                if (response.data?.email && response.data?.purpose === 'register') {
                    const verifiedEmail = response.data.email;
                    localStorage.setItem('verified_email', verifiedEmail);
                    localStorage.setItem('email_verified_at', Date.now().toString());
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Xác thực email thất bại');
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
            <Card className="w-full max-w-md shadow-lg" style={{ borderRadius: 16 }}>
                {status === 'loading' && (
                    <div className="text-center py-8">
                        <Spin size="large" />
                        <p className="mt-4 text-gray-600">Đang xác thực email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        status="success"
                        title="Xác Nhận Thành Công!"
                        subTitle={
                            <div>
                                <p>{message}</p>
                                {email && <p className="text-gray-500 mt-2">Email: <strong>{email}</strong></p>}

                                {purpose === 'register' ? (
                                    <p className="text-gray-600 mt-4 font-medium">
                                        Vui lòng quay lại trang đăng ký để hoàn tất.
                                    </p>
                                ) : (
                                    <p className="text-gray-600 mt-4 font-medium">
                                        Email của bạn đã được cập nhật.
                                    </p>
                                )}

                                <p className="text-gray-400 text-sm mt-2">
                                    Bạn có thể đóng tab này.
                                </p>
                            </div>
                        }
                        extra={[
                            <Button
                                type="primary"
                                key="close"
                                onClick={() => window.close()}
                                className="!bg-black !text-white hover:!bg-gray-800"
                            >
                                Đóng tab này
                            </Button>,
                            purpose === 'register' ? (
                                <Button key="register" onClick={() => navigate('/register')}>
                                    Mở trang đăng ký mới
                                </Button>
                            ) : (
                                <Button key="home" onClick={() => navigate('/')}>
                                    Về trang chủ
                                </Button>
                            )
                        ]}
                    />
                )}

                {status === 'error' && (
                    <Result
                        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        status="error"
                        title="Xác Nhận Thất Bại"
                        subTitle={message}
                        extra={[
                            <Button
                                type="primary"
                                key="retry"
                                onClick={() => navigate('/register')}
                                className="!bg-black !text-white hover:!bg-gray-800"
                            >
                                Đăng ký lại
                            </Button>,
                            <Button key="home" onClick={() => navigate('/')}>
                                Về trang chủ
                            </Button>
                        ]}
                    />
                )}
            </Card>
        </div>
    );
}
