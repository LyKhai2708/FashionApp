export interface Supplier {
    supplier_id: number;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
    tax_code: string;
    created_at: string;
    updated_at: string;
}

export interface SupplierResponse {
    status: string;
    data: {
        suppliers: Supplier[];
        metadata: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

export interface SupplierDetailResponse {
    status: string;
    data: {
        supplier: Supplier;
    };
}

export interface CreateSupplierPayload {
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_code?: string;
}

export interface UpdateSupplierPayload extends CreateSupplierPayload { }
