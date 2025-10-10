import { Button, Divider, Tag } from "antd";
import type { Order } from "../services/orderService";
import { formatVNDPrice } from '../utils/priceFormatter';

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
  if (!order) return null;

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Đơn hàng của bạn / #{order.order_id}</h3>
        <Button onClick={onBack}>Quay lại</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="border p-4 rounded">
          <h4 className="font-medium mb-2">Thông tin người nhận hàng</h4>
          <p><b>Người nhận:</b> {order.receiver_name}</p>
          <p><b>Địa chỉ:</b> {order.shipping_detail_address}, {order.shipping_ward}, {order.shipping_province}</p>
          <p><b>Điện thoại:</b> {order.receiver_phone}</p>
          <p><b>Email:</b> {order.receiver_email}</p>
        </div>

        <div className="border p-4 rounded">
          <h4 className="font-medium mb-2">Thông tin đơn hàng</h4>
          <p><b>Phương thức thanh toán:</b> {getPaymentMethodText(order.payment_method)}</p>
          <p><b>Trạng thái thanh toán:</b> 
            <Tag color={order.payment_status === 'paid' ? 'green' : 'orange'} className="ml-2">
              {getPaymentStatusText(order.payment_status)}
            </Tag>
          </p>
          <p><b>Trạng thái đơn hàng:</b> 
            <Tag color={getStatusColor(order.order_status)} className="ml-2">
              {getStatusText(order.order_status)}
            </Tag>
          </p>
          <p><b>Thời gian đặt hàng:</b> {new Date(order.order_date).toLocaleDateString('vi-VN')}</p>
          {order.notes && <p><b>Ghi chú:</b> {order.notes}</p>}
        </div>
      </div>

      <Divider className="my-2" />

      <div className="space-y-4">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 border-b pb-3">
            <img 
              src={item.image_url || "https://via.placeholder.com/80"} 
              alt={item.product_name} 
              className="w-20 h-20 object-cover rounded" 
            />
            <div className="flex-1">
              <div className="font-medium">{item.product_name}</div>
              <div className="text-sm text-gray-500">
                Màu: {item.color_name} | Size: {item.size_name}
              </div>
              <div className="text-sm text-gray-500">Số lượng: {item.quantity}</div>
            </div>
            <div className="font-semibold">{formatVNDPrice(item.price)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-right">
        <div className="flex justify-end gap-8 mb-1">
          <div className="text-gray-600">Tổng tạm tính</div>
          <div>{formatVNDPrice(order.sub_total)}</div>
        </div>
        <div className="flex justify-end gap-8 mb-3">
          <div className="text-gray-600">Phí vận chuyển</div>
          <div>{formatVNDPrice(order.shipping_fee)}</div>
        </div>
        <div className="flex justify-end gap-8 font-bold text-lg text-red-600">
          <div>Thành tiền</div>
          <div>{formatVNDPrice(order.total_amount)}</div>
        </div>
      </div>
    </div>
  );
}
