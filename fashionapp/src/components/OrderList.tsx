import React from "react";
import { Table, Button, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatVNDPrice } from '../utils/priceFormatter';
import type { Order } from '../services/orderService';

type Props = {
  orders: Order[];
  onView: (id: number) => void;
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

export default function OrdersList({ orders, onView }: Props) {
  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "order_id",
      key: "order_id",
      render: (text: number, record) => (
        <a onClick={() => onView(record.order_id)} className="text-blue-600">
          #{text}
        </a>
      ),
    },
    { 
      title: "Ngày mua", 
      dataIndex: "order_date", 
      key: "order_date",
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    { 
      title: "Số sản phẩm", 
      dataIndex: "items_count", 
      key: "items_count",
      align: "center",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (val: number) => formatVNDPrice(val),
    },
    { 
      title: "Trạng thái", 
      dataIndex: "order_status", 
      key: "order_status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button type="link" onClick={() => onView(record.order_id)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return <Table columns={columns} dataSource={orders} rowKey="order_id" pagination={false} />;
}
