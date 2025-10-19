const knex = require('../database/knex')


async function getTodayRevenue() {
    const today = new Date();
    today.setHours(0,0,0,0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await knex('orders')
    .whereBetween('order_date', [today, tomorrow])
    .where('order_status', 'delivered')
    .where('payment_status', 'paid')
    .sum('total_amount as revenue')
    .count('order_id as order_count')
    .first();

    return {
        revenue: result.revenue || 0,
        order_count: result.order_count || 0,
        period: 'today',
        date: today.toISOString().split('T')[0],
    };
}



async function getRevenueByDays(days) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    console.log(startDate,endDate)
    const result = await knex('orders')
        .whereBetween('order_date', [startDate, endDate])
        .where('order_status', 'delivered')
        .where('payment_status', 'paid')
        .sum('total_amount as revenue')
        .count('order_id as order_count')
        .first();
    return {
        revenue: result.revenue || 0,
        orderCount: result.order_count || 0,
        period: `${days}_days`,
        days: days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

async function getMonthRevenue() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const result = await knex('orders')
        .whereBetween('order_date', [startOfMonth, endOfMonth])
        .where('order_status', 'delivered')
        .where('payment_status', 'paid')
        .sum('total_amount as revenue')
        .count('order_id as order_count')
        .first();
    console.log(result);
    return {
        revenue: result.revenue || 0,
        orderCount: result.order_count || 0,
        period: 'month',
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
    };
}


async function getDailyRevenue(days) {
    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const results = await knex('orders')
        .whereBetween('order_date', [startDate, endDate])
        .where('order_status', 'delivered')
        .where('payment_status', 'paid')
        .select(
            knex.raw("DATE_FORMAT(CONVERT_TZ(order_date, '+00:00', '+07:00'), '%Y-%m-%d') as date"),
            knex.raw('SUM(total_amount) as revenue'),
            knex.raw('COUNT(order_id) as order_count')
        )
        .groupBy(knex.raw("DATE_FORMAT(CONVERT_TZ(order_date, '+00:00', '+07:00'), '%Y-%m-%d')"))
        .orderBy('date', 'asc');
    

    const dateMap = new Map();
    results.forEach(r => {
        let dateStr;
        if (r.date instanceof Date) {
            const year = r.date.getUTCFullYear();
            const month = String(r.date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(r.date.getUTCDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
        } else {
            dateStr = r.date;
        }
        
        dateMap.set(dateStr, {
            date: dateStr,
            revenue: parseFloat(r.revenue) || 0,
            order_count: parseInt(r.order_count) || 0
        });
    });

    const filledResults = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const year = currentDate.getUTCFullYear();
        const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        if (dateMap.has(dateStr)) {
            filledResults.push(dateMap.get(dateStr));
        } else {
            filledResults.push({
                date: dateStr,
                revenue: 0,
                order_count: 0
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledResults;
}


async function getRevenueComparison() {
    const today = await getTodayRevenue();
    const month = await getMonthRevenue();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayRevenue = await knex('orders')
        .whereBetween('order_date', [yesterday, todayStart])
        .where('order_status', 'delivered')
        .where('payment_status', 'paid')
        .sum('total_amount as revenue')
        .first();

    const yesterdayAmount = yesterdayRevenue.revenue || 0;
    const todayChange = yesterdayAmount > 0 
        ? ((today.revenue - yesterdayAmount) / yesterdayAmount * 100).toFixed(2)
        : 0;

    //so sánh với tháng trước
    const lastMonthStart = new Date(month.startDate);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(month.startDate);

    const lastMonthRevenue = await knex('orders')
        .whereBetween('order_date', [lastMonthStart, lastMonthEnd])
        .where('order_status', 'delivered')
        .where('payment_status', 'paid')
        .sum('total_amount as revenue')
        .first();

    const lastMonthAmount = lastMonthRevenue.revenue || 0;
    const monthChange = lastMonthAmount > 0
        ? ((month.revenue - lastMonthAmount) / lastMonthAmount * 100).toFixed(2)
        : 0;

    return {
        today: {
            ...today,
            changePercent: parseFloat(todayChange),
            previousRevenue: yesterdayAmount
        },
        month: {
            ...month,
            changePercent: parseFloat(monthChange),
            previousRevenue: lastMonthAmount
        }
    };
}

module.exports = {
    getTodayRevenue,
    getMonthRevenue,
    getRevenueComparison,
    getDailyRevenue,
    getRevenueByDays
};