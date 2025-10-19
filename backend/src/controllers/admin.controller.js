
const JSend = require('../jsend');
const knex = require('../database/knex');
const revenueService = require('../services/revenue.service');
const ApiError = require('../api-error');

async function getDashboardStast(req,res, next){
    try {
        const revenueStats = await revenueService.getRevenueComparison();


        //tinh user trong thang hien tai, so sanh voi thang truoc
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

        const totalUsers = await knex('users')
            .where('is_active', 1)
            .count('user_id as count')
            .first();
        
        const newUsersThisMonth = await knex('users')
            .where('is_active', 1)
            .whereBetween('created_at', [startOfMonth, endOfMonth])
            .count('user_id as count')
            .first();

        const lastMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const lastMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

        const newUsersLastMonth = await knex('users')
            .where('is_active', 1)
            .whereBetween('created_at', [lastMonthStart, lastMonthEnd])
            .count('user_id as count')
            .first()

        const usersThisMonth = newUsersThisMonth.count || 0;
        const usersLastMonth = newUsersLastMonth.count || 0;
        const userChangePercent = usersLastMonth > 0
                ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(2)
                : 0;

        const totalOrders = await knex('orders')
            .count('order_id as count')
            .first();

        const ordersThisMonth = await knex('orders')
            .whereBetween('order_date', [startOfMonth, endOfMonth])
            .count('order_id as count')
            .first();

    
        const ordersLastMonth = await knex('orders')
            .whereBetween('order_date', [lastMonthStart, lastMonthEnd])
            .count('order_id as count')
            .first()

        const ordersThisMonthCount = ordersThisMonth.count || 0;
        const ordersLastMonthCount = ordersLastMonth.count || 0;
        const orderChangePercent = ordersLastMonthCount > 0
            ? ((ordersThisMonthCount - ordersLastMonthCount) / ordersLastMonthCount * 100).toFixed(2)
            : 0;
        //tong san pham
        const totalProducts = await knex('products')
            .where('del_flag', 0)
            .count('product_id as count')
            .first();
        //don hang dang cho
        const pendingOrders = await knex('orders')
            .where('order_status', 'pending')
            .count('order_id as count')
            .first();
        //don hang hien tai
        const recentOrders = await knex('orders')
            .join('users', 'orders.user_id', 'users.user_id')
            .select(
                'orders.order_id',
                'orders.total_amount',
                'orders.order_status',
                'orders.payment_status',
                'orders.order_date',
                'users.username',
                'orders.receiver_name'
            )
            .orderBy('orders.order_date', 'desc')
            .limit(10);

        //san pham ban nhieu
        const topProducts = await knex('orderdetails')
            .join('product_variants', 'orderdetails.product_variant_id', 'product_variants.product_variants_id')
            .join('products', 'product_variants.product_id', 'products.product_id')
            .select(
                'products.product_id',
                'products.name',
                knex.raw('SUM(orderdetails.quantity) as total_sold'),
                knex.raw('SUM(orderdetails.quantity * orderdetails.price) as total_revenue')
            )
            .groupBy('products.product_id', 'products.name')
            .orderBy('total_sold', 'desc')
            .limit(5);
        

        //top san pham thieu hang
        const lowStockProducts = await knex('product_variants')
            .join('products', 'product_variants.product_id', 'products.product_id')
            .join('sizes', 'product_variants.size_id', 'sizes.size_id')
            .join('colors', 'product_variants.color_id', 'colors.color_id')
            .where('product_variants.stock_quantity', '<', 10)
            .where('products.del_flag', 0)
            .select(
                'products.name',
                'sizes.name',
                'colors.name',
                'product_variants.stock_quantity'
            )
            .orderBy('product_variants.stock_quantity', 'asc')
            .limit(10);
        const stats = {
            revenue: revenueStats,
            overview: {
                users: {
                    total: totalUsers.count,
                    changePercent: parseFloat(userChangePercent),
                    thisMonth: usersThisMonth,
                    lastMonth: usersLastMonth
                },
                orders: {
                    total: totalOrders.count,
                    changePercent: parseFloat(orderChangePercent),
                    thisMonth: ordersThisMonthCount,
                    lastMonth: ordersLastMonthCount
                },
                products: {
                    total: totalProducts.count
                },
                pendingOrders: pendingOrders.count
            },
            recentOrders,
            topProducts,
            lowStockProducts
        };
        return res.json(JSend.success(stats));
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return next(new ApiError(500, error.message || 'Lỗi khi lấy thông tin thống kê'));
    }
}

async function getRevenueChart(req, res, next) {
    try {
        const { days = 30 } = req.query;
        
        const validDays = [7, 30, 90];
        const selectedDays = validDays.includes(parseInt(days)) ? parseInt(days) : 30;

        const dailyRevenue = await revenueService.getDailyRevenue(selectedDays);
        const periodStats = await revenueService.getRevenueByDays(selectedDays);

        res.json(JSend.success({
            days: selectedDays,
            summary: periodStats,
            data: dailyRevenue
        }));
    } catch (error) {
        console.error('Revenue chart error:', error);
        next(error);
    }
}

module.exports = {
    getDashboardStast,
    getRevenueChart
}