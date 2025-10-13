import { Button, Typography, Empty, Popconfirm } from "antd";
import { formatVNDPrice } from '../utils/priceFormatter';
import type { Order } from '../services/orderService';
import orderService from '../services/orderService';
import { useState } from 'react';
import { useMessage } from '../App';

type Props = {
  orders: Order[];
  onView: (id: number) => void;
  onOrderCancelled?: () => void;
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Chờ duyệt';
    case 'processing': return 'Đang xử lý';
    case 'shipped': return 'Đang giao';
    case 'delivered': return 'Đã giao';
    case 'cancelled': return 'Đã hủy';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#FFA500';
    case 'processing': return '#1890ff';
    case 'shipped': return '#13c2c2';
    case 'delivered': return '#52c41a';
    case 'cancelled': return '#ff4d4f';
    default: return '#d9d9d9';
  }
};

export default function OrdersList({ orders, onView, onOrderCancelled }: Props) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const message = useMessage();

  const handleCancelOrder = async (orderId: number) => {
    try {
      setCancellingId(orderId);
      await orderService.cancelOrder(orderId);
      message.success('Hủy đơn hàng thành công');
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancellingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Empty description="Chưa có đơn hàng nào" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Typography.Title level={4} className="mb-6">Đơn hàng của bạn</Typography.Title>
      
      {orders.map((order) => (
        <div 
          key={order.order_id} 
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <Typography.Text strong className="text-base">
                Đơn hàng #DELULU{new Date(order.order_date).getFullYear()}{String(new Date(order.order_date).getMonth() + 1).padStart(2, '0')}{String(order.order_id).padStart(6, '0')}
              </Typography.Text>
              <Typography.Text type="secondary" className="block text-xs mt-1">
                {new Date(order.order_date).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Typography.Text>
            </div>
            <div 
              className="px-3 py-1 rounded text-xs font-semibold"
              style={{ 
                backgroundColor: `${getStatusColor(order.order_status)}20`,
                color: getStatusColor(order.order_status)
              }}
            >
              {getStatusText(order.order_status)}
            </div>
          </div>

          
          <div className="mb-3">
            <Typography.Text type="secondary" className="text-sm">
              {order.items_count || 0} sản phẩm
            </Typography.Text>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-right">
              <Typography.Text type="secondary" className="text-start text-xs block">
                Tổng cộng
              </Typography.Text>
              <Typography.Text strong className="text-lg text-blue-600">
                {formatVNDPrice(order.total_amount)}
              </Typography.Text>
            </div>
            <div className="flex gap-2">
              {order.order_status === 'pending' && (
                <Popconfirm
                  title="Hủy đơn hàng"
                  description="Bạn có chắc chắn muốn hủy đơn hàng này?"
                  onConfirm={() => handleCancelOrder(order.order_id)}
                  okText="Hủy đơn"
                  cancelText="Không"
                  okButtonProps={{ danger: true }}
                >
                  <Button 
                    danger
                    loading={cancellingId === order.order_id}
                    disabled={cancellingId !== null}
                  >
                    Hủy đơn
                  </Button>
                </Popconfirm>
              )}
              <Button 
                type="default"
                onClick={() => onView(order.order_id)}
                className="!border-gray-300"
              >
                Chi tiết
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
