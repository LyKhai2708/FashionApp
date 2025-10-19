import { api } from '../../utils/axios';

export interface DashboardStats {
    revenue: {
        today: {
            revenue: number;
            orderCount: number;
            changePercent: number;
            previousRevenue: number;
        };
        month: {
            revenue: number;
            orderCount: number;
            changePercent: number;
            previousRevenue: number;
        };
    };
    overview: {
        users: {
            total: number;
            changePercent: number;
            thisMonth: number;
            lastMonth: number;
        };
        orders: {
            total: number;
            changePercent: number;
            thisMonth: number;
            lastMonth: number;
        };
        products: {
            total: number;
        };
        pendingOrders: number;
    };
    recentOrders: RecentOrder[];
    topProducts: TopProduct[];
    lowStockProducts: LowStockProduct[];
}

export interface RevenueData {
    date: string;
    revenue: number;
    orders: number;
}

export interface RecentOrder {
    order_id: number;
    username: string;
    receiver_name: string;
    total_amount: number;
    order_status: string;
    payment_status: string;
    order_date: string;
}

export interface TopProduct {
    product_id: number;
    product_name: string;
    total_sold: number;
    total_revenue: number;
}

export interface LowStockProduct {
    product_name: string;
    size_name: string;
    color_name: string;
    stock_quantity: number;
}

class DashboardService {
    async getStats(): Promise<DashboardStats> {
        try {
            const response = await api.get('/api/v1/admin/dashboard/stats');
            return response.data.data;
        } catch (error: any) {
            console.error('Get dashboard stats error:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy thống kê dashboard');
        }
    }


    async getRevenueData(period: 'week' | 'month' | 'year' = 'week'): Promise<any> {
        try {
            const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
            const response = await api.get('/api/v1/admin/dashboard/revenue-chart', {
                params: { days }
            });
            return response.data.data;
        } catch (error: any) {
            console.error('Get revenue data error:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy dữ liệu doanh thu');
        }
    }

}

export const dashboardService = new DashboardService();
export default dashboardService;