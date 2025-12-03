import api from '../utils/axios';
import type {
    SupplierResponse,
    SupplierDetailResponse,
    CreateSupplierPayload,
    UpdateSupplierPayload
} from '../types/supplier';

const API_URL = '/api/v1/suppliers';

const supplierService = {
    getSuppliers: async (page: number = 1, limit: number = 10, search: string = ''): Promise<SupplierResponse> => {
        const response = await api.get(API_URL, {
            params: { page, limit, search }
        });
        return response.data;
    },

    getSupplierById: async (id: number): Promise<SupplierDetailResponse> => {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    createSupplier: async (data: CreateSupplierPayload): Promise<SupplierDetailResponse> => {
        const response = await api.post(API_URL, data);
        return response.data;
    },

    updateSupplier: async (id: number, data: UpdateSupplierPayload): Promise<SupplierDetailResponse> => {
        const response = await api.put(`${API_URL}/${id}`, data);
        return response.data;
    },

    deleteSupplier: async (id: number): Promise<void> => {
        await api.delete(`${API_URL}/${id}`);
    }
};

export default supplierService;
