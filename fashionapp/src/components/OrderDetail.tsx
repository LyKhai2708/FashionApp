import { Button, Divider } from "antd";
import type {Order} from "./OrderList";

type Props = {
  order: (Order & {
    receiver?: {
      name: string;
      phone: string;
      address: string;
      email?: string;
    };
    payment?: string;
    items?: { name: string; price: number; qty: number; img?: string }[];
  }) | null;
  onBack: () => void;
};

export default function OrderDetail({ order, onBack }: Props) {
  if (!order) return null;

  const subtotal = (order.items || []).reduce((s, it) => s + it.price * it.qty, 0);

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Đơn hàng của bạn / {order.id}</h3>
        <Button onClick={onBack}>Quay lại</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="border p-4 rounded">
          <h4 className="font-medium mb-2">Thông tin người nhận hàng</h4>
          <p><b>Người nhận:</b> {order.receiver?.name}</p>
          <p><b>Địa chỉ:</b> {order.receiver?.address}</p>
          <p><b>Điện thoại:</b> {order.receiver?.phone}</p>
          {order.receiver?.email && <p><b>Email:</b> {order.receiver.email}</p>}
        </div>

        <div className="border p-4 rounded">
          <h4 className="font-medium mb-2">Thông tin đơn hàng</h4>
          <p><b>Phương thức thanh toán:</b> {order.payment}</p>
          <p><b>Trạng thái đơn hàng:</b> {order.status}</p>
          <p><b>Thời gian đặt hàng:</b> {order.date}</p>
        </div>
      </div>

      <Divider className="my-2" />

      <div className="space-y-4">
        {(order.items || []).map((it, idx) => (
          <div key={idx} className="flex items-center gap-4 border-b pb-3">
            <img src={it.img || "https://via.placeholder.com/80"} alt={it.name} className="w-20 h-20 object-cover rounded" />
            <div className="flex-1">
              <div className="font-medium">{it.name}</div>
              <div className="text-sm text-gray-500">Số lượng: {it.qty}</div>
            </div>
            <div className="font-semibold">{it.price.toLocaleString("vi-VN")}₫</div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-right">
        <div className="flex justify-end gap-8 mb-1">
          <div className="text-gray-600">Tổng tạm tính</div>
          <div>{subtotal.toLocaleString("vi-VN")}₫</div>
        </div>
        <div className="flex justify-end gap-8 mb-3">
          <div className="text-gray-600">Phí vận chuyển</div>
          <div>Miễn phí</div>
        </div>
        <div className="flex justify-end gap-8 font-bold text-lg text-red-600">
          <div>Thành tiền</div>
          <div>{subtotal.toLocaleString("vi-VN")}₫</div>
        </div>
      </div>
    </div>
  );
}
