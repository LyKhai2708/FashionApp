import { Clock } from 'lucide-react';

interface PaymentCountdownProps {
  timeLeft: number;
  size?: 'small' | 'default' | 'large';
}

export const PaymentCountdown: React.FC<PaymentCountdownProps> = ({ 
  timeLeft, 
  size = 'default' 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sizeClasses = {
    small: 'text-sm p-2',
    default: 'text-base p-4',
    large: 'text-lg p-6'
  };

  if (timeLeft <= 0) {
    return (
      <div className={`bg-red-50 rounded-lg border border-red-200 ${sizeClasses[size]}`}>
        <p className="text-center text-red-600 font-medium">
          Hết thời gian thanh toán
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-orange-50 rounded-lg border border-orange-200 ${sizeClasses[size]}`}>
      <div className="flex items-center justify-center gap-2 text-orange-600">
        <Clock className="w-5 h-5" />
        <p className="font-medium">
          Thời gian thanh toán còn lại: <strong>{formatTime(timeLeft)}</strong>
        </p>
      </div>
    </div>
  );
};