import { Button, Typography, Empty, Pagination, Modal, Input } from "antd";
import { formatVNDPrice } from '../utils/priceFormatter';
import type { Order } from '../services/orderService';
import orderService from '../services/orderService';
import { useState } from 'react';
import { useMessage } from '../App';

type Props = {
  orders: Order[];
  onView: (id: number) => void;
  onOrderCancelled?: () => void;
  total?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
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

export default function OrdersList({ orders, onView, onOrderCancelled, total, currentPage = 1, pageSize = 10, onPageChange }: Props) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const message = useMessage();

  const handleCancelOrder = async () => {
    if (!selectedOrderId || !cancelReason.trim()) {
      message.error('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    try {
      setCancellingId(selectedOrderId);
      await orderService.cancelOrder(selectedOrderId, cancelReason.trim());
      message.success('Hủy đơn hàng thành công');
      setCancelModalVisible(false);
      setCancelReason('');
      setSelectedOrderId(null);
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancellingId(null);
    }
  };

  const showCancelModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setCancelModalVisible(true);
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
                Đơn hàng #{order.order_code || `DELULU${new Date(order.order_date).getFullYear()}${String(new Date(order.order_date).getMonth() + 1).padStart(2, '0')}${String(order.order_id).padStart(6, '0')}`}
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
                <Button 
                  danger
                  loading={cancellingId === order.order_id}
                  disabled={cancellingId !== null}
                  onClick={() => showCancelModal(order.order_id)}
                >
                  Hủy đơn
                </Button>
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
      
      {total && total > pageSize && (
        <div className="flex justify-center mt-6">
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={onPageChange}
            showSizeChanger={false}
            showTotal={(total) => `Tổng ${total} đơn hàng`}
          />
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        title="Hủy đơn hàng"
        open={cancelModalVisible}
        onOk={handleCancelOrder}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelReason('');
          setSelectedOrderId(null);
        }}
        okText="Xác nhận hủy"
        cancelText="Không hủy"
        okButtonProps={{ danger: true, loading: cancellingId !== null }}
        cancelButtonProps={{ disabled: cancellingId !== null }}
      >
        <div className="space-y-4">
          <p>Bạn có chắc chắn muốn hủy đơn hàng này không?</p>
          <div>
            <label className="block text-sm font-medium mb-2">
              Lý do hủy đơn hàng <span className="text-red-500">*</span>
            </label>
            <Input.TextArea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Vui lòng nhập lý do hủy đơn hàng..."
              rows={3}
              maxLength={500}
              showCount
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
