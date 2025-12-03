export interface PurchaseOrderItem {
    po_item_id: number;
    po_id: number;
    product_variant_id: number;
    quantity: number;
    unit_price: string;
    total_price: string;
    created_at: string;
    product_name?: string;
    thumbnail?: string;
    size_name?: string;
    color_name?: string;
}

export interface PurchaseOrder {
    po_id: number;
    supplier_id: number;
    staff_id: number;
    total_amount: string;
    status: 'pending' | 'completed' | 'cancelled';
    notes: string;
    expected_date: string;
    created_at: string;
    updated_at: string;
    supplier_name?: string;
    supplier_phone?: string;
    staff_name?: string;
    items?: PurchaseOrderItem[];
}

export interface PurchaseOrderResponse {
    status: string;
    data: {
        orders: PurchaseOrder[];
        metadata: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

export interface PurchaseOrderDetailResponse {
    status: string;
    data: {
        order: PurchaseOrder;
    };
}

export interface CreatePurchaseOrderItemPayload {
    product_variant_id: number;
    quantity: number;
    unit_price: number;
}

export interface CreatePurchaseOrderPayload {
    supplier_id: number;
    items: CreatePurchaseOrderItemPayload[];
    notes?: string;
    expected_date?: string;
}
