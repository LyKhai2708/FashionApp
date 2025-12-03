import api from '../utils/axios';

export interface InventoryOverview {
    total: {
        variants: number;
        stock: number;
        lowStock: number;
        outOfStock: number;
        avgStock: string;
    };
    byCategory: {
        categoryId: number;
        categoryName: string;
        productCount: number;
        totalStock: number;
        lowStockCount: number;
        outOfStockCount: number;
    }[];
}

export interface LowStockProduct {
    product_variants_id: number;
    product_id: number;
    product_name: string;
    thumbnail: string;
    size_name: string;
    color_name: string;
    stock_quantity: number;
    category_name: string;
    brand_name: string;
}

export interface StockHistoryItem {
    history_id: number;
    product_variant_id: number;
    action_type: 'adjustment' | 'sale' | 'return' | 'damaged' | 'restock' | 'order_cancelled';
    quantity_before: number;
    quantity_change: number;
    quantity_after: number;
    reason: string;
    notes: string;
    created_at: string;
    product_id: number;
    product_name: string;
    size_name: string;
    color_name: string;
    admin_username: string;
    reference_type?: 'order' | 'purchase_order' | 'adjustment';
    supplier_name?: string;
    customer_name?: string;
}

export interface StockTrendItem {
    date: string;
    stock_in: number;
    stock_out: number;
    transaction_count: number;
}

class InventoryService {
    async getOverview(): Promise<InventoryOverview> {
        try {
            const response = await api.get('/api/v1/inventory/overview');
            return response.data.data.overview;
        } catch (error: any) {
            console.error('Get inventory overview error:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy tổng quan tồn kho');
        }
    }

    async getLowStockProducts(params?: {
        page?: number;
        limit?: number;
        threshold?: number;
        categoryId?: number;
        brandId?: number;
        search?: string;
        stockStatus?: 'all' | 'low' | 'out';
    }): Promise<{
        products: LowStockProduct[];
        metadata: any;
    }> {
        try {
            const query = new URLSearchParams();
            if (params?.page) query.append('page', params.page.toString());
            if (params?.limit) query.append('limit', params.limit.toString());
            if (params?.threshold) query.append('threshold', params.threshold.toString());
            if (params?.categoryId) query.append('categoryId', params.categoryId.toString());
            if (params?.brandId) query.append('brandId', params.brandId.toString());
            if (params?.search) query.append('search', params.search);
            if (params?.stockStatus) query.append('stockStatus', params.stockStatus);

            const response = await api.get(`/api/v1/inventory/low-stock?${query.toString()}`);
            return response.data.data;
        } catch (error: any) {
            console.error('Get low stock products error:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy danh sách sản phẩm sắp hết hàng');
        }
    }

    async adjustStock(variantId: number, data: {
        quantityChange: number;
        reason: string;
        notes?: string;
        actionType?: 'adjustment' | 'restock' | 'damaged' | 'return';
    }): Promise<any> {
        try {
            const response = await api.post(`/api/v1/inventory/adjust/${variantId}`, data);
            return response.data.data;
        } catch (error: any) {
            console.error('Adjust stock error:', error);
            throw new Error(error.response?.data?.message || 'Không thể điều chỉnh tồn kho');
        }
    }

    async getStockHistory(params?: {
        page?: number;
        limit?: number;
        variantId?: number;
        productId?: number;
        actionType?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        history: StockHistoryItem[];
        metadata: any;
    }> {
        try {
            const query = new URLSearchParams();
            if (params?.page) query.append('page', params.page.toString());
            if (params?.limit) query.append('limit', params.limit.toString());
            if (params?.variantId) query.append('variantId', params.variantId.toString());
            if (params?.productId) query.append('productId', params.productId.toString());
            if (params?.actionType) query.append('actionType', params.actionType);
            if (params?.startDate) query.append('startDate', params.startDate);
            if (params?.endDate) query.append('endDate', params.endDate);

            const response = await api.get(`/api/v1/inventory/history?${query.toString()}`);
            return response.data.data;
        } catch (error: any) {
            console.error('Get stock history error:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy lịch sử tồn kho');
        }
    }

    async getStockTrend(days: number = 30): Promise<StockTrendItem[]> {
        try {
            const response = await api.get(`/api/v1/inventory/trend?days=${days}`);
            return response.data.data.trend;
        } catch (error: any) {
            console.error('Get stock trend error:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy xu hướng tồn kho');
        }
    }
}

export const inventoryService = new InventoryService();
export default inventoryService;
