import api from '../utils/axios';
import type {
    PurchaseOrderResponse,
    PurchaseOrderDetailResponse,
    CreatePurchaseOrderPayload
} from '../types/purchaseOrder';

const API_URL = '/api/v1/purchase-orders';

const purchaseOrderService = {
    getPurchaseOrders: async (page: number = 1, limit: number = 10, status?: string, supplier_id?: number): Promise<PurchaseOrderResponse> => {
        const params: any = { page, limit };
        if (status) params.status = status;
        if (supplier_id) params.supplier_id = supplier_id;

        const response = await api.get(API_URL, {
            params
        });
        return response.data;
    },

    getPurchaseOrderById: async (id: number): Promise<PurchaseOrderDetailResponse> => {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    createPurchaseOrder: async (data: CreatePurchaseOrderPayload): Promise<PurchaseOrderDetailResponse> => {
        const response = await api.post(API_URL, data);
        return response.data;
    },

    updateStatus: async (id: number, status: 'completed' | 'cancelled'): Promise<void> => {
        await api.patch(`${API_URL}/${id}/status`, { status });
    },

    deletePurchaseOrder: async (id: number): Promise<void> => {
        await api.delete(`${API_URL}/${id}`);
    }
};

export default purchaseOrderService;
