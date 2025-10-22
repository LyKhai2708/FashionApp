import { Button } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';

interface RetryPaymentButtonProps {
  onRetry: () => void;
  loading: boolean;
  disabled: boolean;
  size?: 'small' | 'middle' | 'large';
  block?: boolean;
}

export const RetryPaymentButton: React.FC<RetryPaymentButtonProps> = ({
  onRetry,
  loading,
  disabled,
  size = 'large',
  block = false
}) => {
  return (
    <Button
      type="primary"
      size={size}
      block={block}
      loading={loading}
      disabled={disabled}
      icon={<CreditCardOutlined />}
      onClick={onRetry}
    >
      {disabled ? 'Hết hạn thanh toán' : 'Thanh toán lại'}
    </Button>
  );
};