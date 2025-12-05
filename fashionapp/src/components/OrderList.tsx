import { Button, Typography, Empty, Pagination, Modal, Input, Space, Tag } from "antd";
import { ClockCircleOutlined, SyncOutlined, CarOutlined, CheckCircleOutlined, CloseCircleOutlined, CreditCardOutlined } from '@ant-design/icons';
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
  orderStatusFilter?: string | null;
  paymentStatusFilter?: string | null;
  onOrderStatusChange?: (status: string | null) => void;
  onPaymentStatusChange?: (status: string | null) => void;
  orderStatusCounts?: Record<string, number>;
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'processing': return 'Processing';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'cod': return 'COD';
    case 'bank_transfer': return 'Bank Transfer';
    case 'payos': return 'PayOS';
    case 'momo': return 'MoMo';
    case 'vnpay': return 'VNPay';
    default: return method;
  }
};

const getPaymentStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Unpaid';
    case 'paid': return 'Paid';
    case 'failed': return 'Failed';
    case 'cancelled': return 'Cancelled';
    case 'refunded': return 'Refunded';
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

export default function OrdersList({
  orders,
  onView,
  onOrderCancelled,
  total,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  orderStatusFilter = null,
  paymentStatusFilter = null,
  onOrderStatusChange,
  onPaymentStatusChange,
  orderStatusCounts = {}
}: Props) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const message = useMessage();

  const handleCancelOrder = async () => {
    if (!selectedOrderId || !cancelReason.trim()) {
      message.error('Please enter cancellation reason');
      return;
    }

    try {
      setCancellingId(selectedOrderId);
      await orderService.cancelOrder(selectedOrderId, cancelReason.trim());
      message.success('Order cancelled successfully');
      setCancelModalVisible(false);
      setCancelReason('');
      setSelectedOrderId(null);
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (error: any) {
      message.error(error.message || 'Cannot cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const showCancelModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setCancelModalVisible(true);
  };

  const orderStatusTabs = [
    { key: null, label: 'All', icon: null, color: '#666' },
    { key: 'pending', label: 'Pending', icon: <ClockCircleOutlined />, color: '#1890ff' },
    { key: 'processing', label: 'Processing', icon: <SyncOutlined spin />, color: '#fa8c16' },
    { key: 'shipped', label: 'Shipping', icon: <CarOutlined />, color: '#722ed1' },
    { key: 'delivered', label: 'Completed', icon: <CheckCircleOutlined />, color: '#52c41a' },
    { key: 'cancelled', label: 'Cancelled', icon: <CloseCircleOutlined />, color: '#ff4d4f' },
  ];

  const paymentStatusTabs = [
    { key: null, label: 'All' },
    { key: 'paid', label: 'Paid', color: '#52c41a' },
    { key: 'pending', label: 'Unpaid', color: '#ff4d4f' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Typography.Title level={4} className="!mb-2">Order History</Typography.Title>
        <Typography.Text type="secondary" className="text-sm">
          Manage and track all your orders
        </Typography.Text>
      </div>

      <div>
        <Typography.Text strong className="block mb-3 text-sm">Order Status</Typography.Text>
        <Space size="small" wrap>
          {orderStatusTabs.map((tab) => {
            const count = tab.key ? orderStatusCounts[tab.key] || 0 : orderStatusCounts['all'] || 0;
            const isActive = orderStatusFilter === tab.key;
            return (
              <Button
                key={tab.key || 'all'}
                type={isActive ? 'primary' : 'default'}
                icon={tab.icon}
                onClick={() => onOrderStatusChange?.(tab.key)}
                className={`!rounded-full !h-9 transition-all ${isActive
                    ? '!shadow-md'
                    : '!bg-white hover:!border-gray-400'
                  }`}
                style={{
                  backgroundColor: isActive ? tab.color : undefined,
                  borderColor: isActive ? tab.color : undefined,
                  color: isActive ? '#fff' : tab.color
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </Space>
      </div>

      <div>
        <Typography.Text strong className="block mb-3 text-sm">Payment Status</Typography.Text>
        <Space size="small" wrap>
          {paymentStatusTabs.map((tab) => {
            const isActive = paymentStatusFilter === tab.key;
            return (
              <Button
                key={tab.key || 'all-payment'}
                type={isActive ? 'primary' : 'default'}
                onClick={() => onPaymentStatusChange?.(tab.key)}
                className={`!rounded-full !h-9 transition-all ${isActive
                    ? '!shadow-md'
                    : '!bg-white hover:!border-gray-400'
                  }`}
                style={{
                  backgroundColor: isActive ? tab.color : undefined,
                  borderColor: isActive ? tab.color : undefined,
                  color: isActive ? '#fff' : (tab.color || undefined)
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Space>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Empty description="No orders found" />
        </div>
      )}

      {/* Orders List */}
      {orders.length > 0 && (
        <div className="space-y-4">

          {orders.map((order) => (
            <div
              key={order.order_id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Typography.Text strong className="text-base">
                        Order #{order.order_code || order.order_id}
                      </Typography.Text>
                      <Tag
                        color={getStatusColor(order.order_status)}
                        className="!m-0 !rounded-full !px-3"
                      >
                        {getStatusText(order.order_status)}
                      </Tag>
                    </div>
                    <Typography.Text type="secondary" className="text-xs mt-1 block">
                      Date: {new Date(order.order_date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography.Text>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <Typography.Text type="secondary" className="text-sm">
                    {order.items_count || 0} products
                  </Typography.Text>
                  <div className="flex items-center gap-2">
                    <Tag icon={<CreditCardOutlined />} className="!m-0">
                      {getPaymentMethodText(order.payment_method)}
                    </Tag>
                    <Tag
                      color={order.payment_status === 'paid' ? 'success' : 'warning'}
                      className="!m-0"
                    >
                      {getPaymentStatusText(order.payment_status)}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text type="secondary" className="text-xs block mb-1">
                    Total
                  </Typography.Text>
                  <Typography.Text strong className="text-xl" style={{ color: '#1890ff' }}>
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
                      className="!rounded-md"
                    >
                      Cancel Order
                    </Button>
                  )}
                  <Button
                    type="default"
                    onClick={() => onView(order.order_id)}
                    className="!border-gray-300 !rounded-md"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total && total > pageSize && (
        <div className="flex justify-center mt-6">
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={onPageChange}
            showSizeChanger={false}
            showTotal={(total) => `Total ${total} orders`}
          />
        </div>
      )}

      <Modal
        title="Cancel Order"
        open={cancelModalVisible}
        onOk={handleCancelOrder}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelReason('');
          setSelectedOrderId(null);
        }}
        okText="Confirm Cancellation"
        cancelText="Don't Cancel"
        okButtonProps={{ danger: true, loading: cancellingId !== null }}
        cancelButtonProps={{ disabled: cancellingId !== null }}
      >
        <div className="space-y-4">
          <p>Are you sure you want to cancel this order?</p>
          <div>
            <label className="block text-sm font-medium mb-2">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <Input.TextArea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please enter the reason for cancellation..."
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
