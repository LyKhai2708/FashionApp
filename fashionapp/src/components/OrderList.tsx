import React from "react";
import { Table, Button } from "antd";
import type { ColumnsType } from "antd/es/table";

export interface Order {
  id: string;
  date: string;
  itemsCount: number;
  total: number;
  status: string;
}

type Props = {
  orders: Order[];
  onView: (id: string) => void;
};

export default function OrdersList({ orders, onView }: Props) {
  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "id",
      key: "id",
      render: (text: string, record) => (
        <a onClick={() => onView(record.id)} className="text-blue-600">
          {text}
        </a>
      ),
    },
    { title: "Ngày mua", dataIndex: "date", key: "date" },
    { title: "Số sản phẩm", dataIndex: "itemsCount", key: "itemsCount" },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      render: (val: number) => val.toLocaleString("vi-VN") + "₫",
    },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button type="link" onClick={() => onView(record.id)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return <Table columns={columns} dataSource={orders} rowKey="id" pagination={false} />;
}
