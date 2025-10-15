import { Button, Divider, Tag, Card, Typography, Space } from "antd";
import { ArrowLeftOutlined, UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import type { Order } from "../services/orderService";
import { formatVNDPrice } from '../utils/priceFormatter';
import { useState } from "react";
import ReviewForm from "./review/ReviewForm";

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
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    productId: number;
    orderId: number;
  } | null>(null);

  const handleOpenReview = (productId: number) => {
    setSelectedProduct({
      productId: productId,
      orderId: order!.order_id
    });
    setReviewModalVisible(true);
  };

  const handleReviewSuccess = () => {
    setReviewModalVisible(false);
    setSelectedProduct(null);
  };
  if (!order) return null;
  const isDelivered = order.order_status === 'delivered';
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
              <Title level={3} className="!mb-1">Đơn hàng #{order.order_id}</Title>
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
          </Space>
        </Card>
      </div>

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
                    <Button 
                      size="small"
                      type="primary"
                      onClick={() => handleOpenReview(item.product_id)}
                      className="!bg-blue-500 hover:!bg-blue-600"
                    >
                      Đánh giá sản phẩm
                    </Button>
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
          userOrders={[{
            order_id: order.order_id,
            order_date: order.order_date
          }]}
        />
      )}
    </div>
  );
}
