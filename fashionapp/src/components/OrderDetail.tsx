import { Button, Divider, Tag, Card, Typography, Space, Modal, Rate } from "antd";
import { ArrowLeftOutlined, UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import type { Order } from "../services/orderService";
import { formatVNDPrice } from '../utils/priceFormatter';
import { useEffect, useState } from "react";
import ReviewForm from "./review/ReviewForm";
import reviewService from "../services/reviewService";
import { useRetryPayment } from '../hooks/useRetryPayment';
import { PaymentCountdown } from '../components/PaymentCountdown';
import { RetryPaymentButton } from '../components/RetryPaymentButton';
const { Title, Text } = Typography;
type Props = {
  order: Order | null;
  onBack: () => void;
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
    case 'pending': return 'orange';
    case 'processing': return 'blue';
    case 'shipped': return 'cyan';
    case 'delivered': return 'green';
    case 'cancelled': return 'red';
    default: return 'default';
  }
};

const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'cod': return 'Thanh toán khi nhận hàng';
    case 'bank_transfer': return 'Chuyển khoản ngân hàng';
    default: return method;
  }
};

const getPaymentStatusText = (status: string) => {
  switch (status) {
    case 'unpaid': return 'Chưa thanh toán';
    case 'paid': return 'Đã thanh toán';
    default: return status;
  }
};


export default function OrderDetail({ order, onBack }: Props) {

  const showRetryButton = 
  order.order_status === 'pending' && 
  order.payment_method === 'payos' &&
  (order.payment_status === 'failed' || order.payment_status === 'pending');

const { 
  retryPayment, 
  loading: retryLoading, 
  canRetry, 
  timeLeft 
} = useRetryPayment(order.order_id);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    productId: number;
    orderId: number;
    reviewId?: number;
    editMode?: boolean;
    initialData?: { rating: number; comment: string; order_id: number };
  } | null>(null);
  const [viewModal, setViewModal] = useState<null | { rating: number; comment: string }>(null);
  const [itemReviews, setItemReviews] = useState<Record<number, any>>({}); // productId -> review | null

  const handleOpenReview = (productId: number) => {
    setSelectedProduct({
      productId: productId,
      orderId: order!.order_id
    });
    setReviewModalVisible(true);
  };

  const handleOpenEdit = (productId: number) => {
    const review = itemReviews[productId];
    if (!review) return;
    setSelectedProduct({
      productId,
      orderId: order!.order_id,
      reviewId: review.id,
      editMode: true,
      initialData: { rating: review.rating, comment: review.comment, order_id: order!.order_id }
    });
    setReviewModalVisible(true);
  };

  const handleReviewSuccess = () => {
    setReviewModalVisible(false);
    setSelectedProduct(null);
    if (order && selectedProduct?.productId) {
      fetchItemReview(selectedProduct.productId);
    }
  };
  if (!order) return null;
  const isDelivered = order.order_status === 'delivered';

  const fetchItemReview = async (productId: number) => {
    try {
      const review = await reviewService.getMyReview(productId, order!.order_id);
      setItemReviews(prev => ({ ...prev, [productId]: review }));
    } catch (_) {
      setItemReviews(prev => ({ ...prev, [productId]: null }));
    }
  };

  useEffect(() => {
    if (!order || !isDelivered) return;
    const productIds = (order.items || []).map((i: any) => i.product_id);
    productIds.forEach(pid => fetchItemReview(pid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.order_id, isDelivered]);
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={onBack}
              type="text"
              size="large"
            />
            <div>
              <Title level={3} className="!mb-1">Đơn hàng #{order.order_code || order.order_id}</Title>
              <div className="space-y-1">
                <Text type="secondary" className="flex items-center gap-2">
                  <CalendarOutlined />
                  Đặt hàng: {new Date(order.order_date).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                {order.shipped_at && (
                  <Text type="secondary" className="flex items-center gap-2 text-xs">
                    Đã giao cho vận chuyển: {new Date(order.shipped_at).toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}
                {order.delivered_at && (
                  <Text type="secondary" className="flex items-center gap-2 text-xs">
                    Đã giao thành công: {new Date(order.delivered_at).toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}
                {order.cancelled_at && (
                  <Text type="secondary" className="flex items-center gap-2 text-xs">
                    Đã hủy: {new Date(order.cancelled_at).toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Tag color={getStatusColor(order.order_status)} className="px-3 py-1 text-sm font-medium">
              {getStatusText(order.order_status)}
            </Tag>
            <Tag color={order.payment_status === 'paid' ? 'green' : 'orange'} className="px-3 py-1 text-sm font-medium">
              {getPaymentStatusText(order.payment_status)}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Order Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receiver Info */}
        <Card title={<span className="flex items-center gap-2"><UserOutlined /> Thông tin người nhận</span>} className="shadow-sm">
          <Space direction="vertical" size="middle" className="w-full">
            <div className="flex items-center gap-3">
              <UserOutlined className="text-gray-500" />
              <div>
                <Text strong>{order.receiver_name}</Text>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <HomeOutlined className="text-gray-500 mt-1" />
              <div>
                <Text>{order.shipping_detail_address}</Text><br/>
                <Text type="secondary">{order.shipping_ward}, {order.shipping_province}</Text>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PhoneOutlined className="text-gray-500" />
              <Text>{order.receiver_phone}</Text>
            </div>
            <div className="flex items-center gap-3">
              <MailOutlined className="text-gray-500" />
              <Text>{order.receiver_email}</Text>
            </div>
          </Space>
        </Card>

        {/* Payment & Order Info */}
        <Card title={<span className="flex items-center gap-2"><FileTextOutlined /> Thông tin thanh toán</span>} className="shadow-sm">
          <Space direction="vertical" size="middle" className="w-full">
            <div className="flex justify-between items-center">
              <Text>Phương thức thanh toán:</Text>
              <Text strong>{getPaymentMethodText(order.payment_method)}</Text>
            </div>
            <div className="flex justify-between items-center">
              <Text>Tổng tạm tính:</Text>
              <Text>{formatVNDPrice(order.sub_total)}</Text>
            </div>
            <div className="flex justify-between items-center">
              <Text>Phí vận chuyển:</Text>
              <Text>{formatVNDPrice(order.shipping_fee)}</Text>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between items-center">
              <Text strong className="text-lg">Thành tiền:</Text>
              <Text strong className="text-lg text-red-600">{formatVNDPrice(order.total_amount)}</Text>
            </div>
            {order.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <Text strong>Ghi chú:</Text><br/>
                <Text type="secondary">{order.notes}</Text>
              </div>
            )}
            {order.cancel_reason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Text strong className="text-red-600">Lý do hủy:</Text><br/>
                <Text type="secondary" className="text-red-700">{order.cancel_reason}</Text>
              </div>
            )}
          </Space>
        </Card>
      </div>

      {/* Retry Payment Section */}
      {showRetryButton && (
        <Card className="shadow-sm border-orange-200">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-700">
              <FileTextOutlined />
              <span className="font-semibold text-lg">Đơn hàng chưa thanh toán</span>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <Text className="text-orange-800">
                Đơn hàng của bạn chưa được thanh toán. Vui lòng hoàn tất thanh toán để đơn hàng được xử lý.
              </Text>
            </div>

            <PaymentCountdown timeLeft={timeLeft} size="default" />
            
            <RetryPaymentButton
              onRetry={retryPayment}
              loading={retryLoading}
              disabled={!canRetry}
              size="large"
              block
            />
          </div>
        </Card>
      )}

      {/* Order Items */}
      <Card 
        title={<span className="text-lg font-semibold">Sản phẩm đã đặt ({order.items?.length || 0} sản phẩm)</span>} 
        className="shadow-sm"
      >
        <div className="space-y-4">
          {(order.items || []).map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
              <div className="relative">
                <img 
                  src={item.image_url || "https://via.placeholder.com/80"} 
                  alt={item.product_name} 
                  className="w-20 h-20 object-cover rounded-lg" 
                />
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                  {item.quantity}
                </div>
              </div>
              
              <div className="flex-1">
                <Title level={5} className="!mb-2">{item.product_name}</Title>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" style={{backgroundColor: item.color_name?.toLowerCase()}}></div>
                    <Text type="secondary">Màu: {item.color_name}</Text>
                  </div>
                  <Text type="secondary">Size: {item.size_name}</Text>
                </div>
                <Text type="secondary">Số lượng: {item.quantity}</Text>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold text-red-600 mb-2">
                  {formatVNDPrice(item.price * item.quantity)}
                </div>
                <Text type="secondary" className="text-sm">
                  {formatVNDPrice(item.price)} x {item.quantity}
                </Text>
                
                {isDelivered && (
                  <div className="mt-3">
                    {(() => {
                      const r = itemReviews[item.product_id];
                      if (!r) {
                        return (
                          <Button 
                            size="small"
                            type="primary"
                            onClick={() => handleOpenReview(item.product_id)}
                            className="!bg-blue-500 hover:!bg-blue-600"
                          >
                            Đánh giá sản phẩm
                          </Button>
                        );
                      }
                      const isFirstEditAllowed = r.created_at === r.updated_at;
                      if (isFirstEditAllowed) {
                        return (
                          <Button 
                            size="small"
                            type="default"
                            onClick={() => handleOpenEdit(item.product_id)}
                            className="!text-blue-600"
                          >
                            Sửa đánh giá
                          </Button>
                        );
                      }
                      return (
                        <Button 
                          size="small"
                          type="default"
                          onClick={() => setViewModal({ rating: r.rating, comment: r.comment })}
                        >
                          Xem đánh giá
                        </Button>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selectedProduct && (
        <ReviewForm
          visible={reviewModalVisible}
          onClose={() => {
            setReviewModalVisible(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleReviewSuccess}
          productId={selectedProduct.productId}
          editMode={selectedProduct.editMode}
          reviewId={selectedProduct.reviewId}
          initialData={selectedProduct.initialData || { order_id: selectedProduct.orderId as number, rating: 5, comment: '' }}
          userOrders={[{
            order_id: order.order_id,
            order_date: order.order_date
          }]}
        />
      )}

      <Modal
        open={!!viewModal}
        onCancel={() => setViewModal(null)}
        footer={[
          <Button key="close" onClick={() => setViewModal(null)}>Đóng</Button>
        ]}
        title="Đánh giá của bạn"
      >
        {viewModal && (
          <div className="space-y-3">
            <Rate value={viewModal.rating} disabled />
            <Typography.Paragraph>{viewModal.comment}</Typography.Paragraph>
          </div>
        )}
      </Modal>
    </div>
  );
}
