const knex = require('../database/knex');
const Paginator = require('./paginator');
const stockHelper = require('./stock.helper');

async function getInventoryOverview() {
    const overview = await knex('categories')
        .leftJoin('products', function () {
            this.on('categories.category_id', '=', 'products.category_id')
                .andOn('products.del_flag', '=', knex.raw('?', [0]));
        })
        .leftJoin('product_variants', 'products.product_id', 'product_variants.product_id')
        .select(
            'categories.category_id',
            'category_name',
            knex.raw('COUNT(DISTINCT products.product_id) as product_count'),
            knex.raw('COALESCE(SUM(product_variants.stock_quantity), 0) as total_stock'),
            knex.raw('COUNT(CASE WHEN product_variants.stock_quantity < 10 THEN 1 END) as low_stock_count'),
            knex.raw('COUNT(CASE WHEN product_variants.stock_quantity = 0 THEN 1 END) as out_of_stock_count')
        )
        .groupBy('categories.category_id', 'category_name')
        .orderBy('category_name');

    const totalStats = await knex('product_variants')
        .join('products', function () {
            this.on('product_variants.product_id', '=', 'products.product_id')
                .andOn('products.del_flag', '=', knex.raw('?', [0]));
        })
        .select(
            knex.raw('COUNT(*) as total_variants'),
            knex.raw('SUM(stock_quantity) as total_stock'),
            knex.raw('COUNT(CASE WHEN stock_quantity < 10 THEN 1 END) as low_stock_count'),
            knex.raw('COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_count'),
            knex.raw('AVG(stock_quantity) as avg_stock')
        )
        .first();

    return {
        total: {
            variants: parseInt(totalStats.total_variants) || 0,
            stock: parseInt(totalStats.total_stock) || 0,
            lowStock: parseInt(totalStats.low_stock_count) || 0,
            outOfStock: parseInt(totalStats.out_of_stock_count) || 0,
            avgStock: parseFloat(totalStats.avg_stock).toFixed(2) || 0
        },
        byCategory: overview.map(cat => ({
            categoryId: cat.category_id,
            categoryName: cat.category_name,
            productCount: parseInt(cat.product_count) || 0,
            totalStock: parseInt(cat.total_stock) || 0,
            lowStockCount: parseInt(cat.low_stock_count) || 0,
            outOfStockCount: parseInt(cat.out_of_stock_count) || 0
        }))
    };
}

async function getLowStockProducts(payload) {
    const {
        page = 1,
        limit = 20,
        threshold = 10,
        categoryId,
        brandId,
        search,
        stockStatus
    } = payload;

    const paginator = new Paginator(page, limit);

    let query = knex('product_variants as pv')
        .join('products as p', 'pv.product_id', 'p.product_id')
        .join('sizes as s', 'pv.size_id', 's.size_id')
        .join('colors as c', 'pv.color_id', 'c.color_id')
        .leftJoin('categories as cat', 'p.category_id', 'cat.category_id')
        .leftJoin('brand as b', 'p.brand_id', 'b.id')
        .where('p.del_flag', 0)
        .where(function () {
            if (stockStatus === 'out') {
                this.where('pv.stock_quantity', 0);
            } else if (stockStatus === 'low') {
                this.where('pv.stock_quantity', '>', 0)
                    .where('pv.stock_quantity', '<', threshold);
            } else {
                this.where('pv.stock_quantity', '<', threshold);
            }
        });

    if (categoryId) {
        query = query.where('p.category_id', categoryId);
    }

    if (brandId) {
        query = query.where('p.brand_id', brandId);
    }

    if (search) {
        query = query.where(function () {
            this.whereILike('p.name', `%${search}%`)
                .orWhereILike('s.name', `%${search}%`)
                .orWhereILike('c.name', `%${search}%`);
        });
    }

    const countQuery = query.clone().count('* as count').first();

    const results = await query
        .select(
            'pv.product_variants_id',
            'p.product_id',
            'p.name as product_name',
            'p.thumbnail',
            's.name as size_name',
            'c.name as color_name',
            'pv.stock_quantity',
            'category_name',
            'b.name as brand_name'
        )
        .orderBy('pv.stock_quantity', 'asc')
        .limit(paginator.limit)
        .offset(paginator.offset);

    const { count } = await countQuery;

    return {
        metadata: paginator.getMetadata(parseInt(count) || 0),
        products: results
    };
}

async function adjustStock(variantId, adminId, payload) {
    const { quantityChange, reason, notes, actionType = 'adjustment' } = payload;

    if (!quantityChange || quantityChange === 0) {
        throw new Error('Số lượng thay đổi phải khác 0');
    }

    return await knex.transaction(async (trx) => {
        const result = await stockHelper.updateStock(trx, variantId, quantityChange, {
            actionType,
            adminId,
            reason,
            notes
        });

        return result;
    });
}

async function getStockHistory(payload) {
    const {
        page = 1,
        limit = 50,
        variantId,
        productId,
        actionType,
        startDate,
        endDate
    } = payload;

    const paginator = new Paginator(page, limit);

    let query = knex('stock_history as sh')
        .join('product_variants as pv', 'sh.product_variant_id', 'pv.product_variants_id')
        .join('products as p', 'pv.product_id', 'p.product_id')
        .join('sizes as s', 'pv.size_id', 's.size_id')
        .join('colors as c', 'pv.color_id', 'c.color_id')
        .leftJoin('users as u', 'sh.admin_id', 'u.user_id')
        .leftJoin('purchase_orders as po', function () {
            this.on('sh.reference_id', '=', 'po.po_id')
                .andOn('sh.reference_type', '=', knex.raw('?', ['purchase_order']));
        })
        .leftJoin('suppliers as sup', 'po.supplier_id', 'sup.supplier_id')
        .leftJoin('orders as o', function () {
            this.on('sh.reference_id', '=', 'o.order_id')
                .andOn('sh.reference_type', '=', knex.raw('?', ['order']));
        })
        .leftJoin('users as customer', 'o.user_id', 'customer.user_id');

    if (variantId) {
        query = query.where('sh.product_variant_id', variantId);
    }

    if (productId) {
        query = query.where('p.product_id', productId);
    }

    if (actionType) {
        query = query.where('sh.action_type', actionType);
    }

    if (startDate) {
        query = query.where('sh.created_at', '>=', startDate);
    }

    if (endDate) {
        query = query.where('sh.created_at', '<=', endDate);
    }

    const countQuery = query.clone().count('* as count').first();

    const results = await query
        .select(
            'sh.history_id',
            'sh.product_variant_id',
            'sh.action_type',
            'sh.quantity_before',
            'sh.quantity_change',
            'sh.quantity_after',
            'sh.reason',
            'sh.notes',
            'sh.created_at',
            'sh.reference_id',
            'sh.reference_type',
            'p.product_id',
            'p.name as product_name',
            's.name as size_name',
            'c.name as color_name',
            'u.username as admin_username',
            'sup.name as supplier_name',
            'customer.username as customer_name'
        )
        .orderBy('sh.created_at', 'desc')
        .limit(paginator.limit)
        .offset(paginator.offset);

    const { count } = await countQuery;

    return {
        metadata: paginator.getMetadata(parseInt(count) || 0),
        history: results
    };
}

async function getStockTrend(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trend = await knex('stock_history')
        .select(
            knex.raw('DATE(created_at) as date'),
            knex.raw('SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) as stock_in'),
            knex.raw('SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) as stock_out'),
            knex.raw('COUNT(*) as transaction_count')
        )
        .where('created_at', '>=', startDate)
        .groupBy(knex.raw('DATE(created_at)'))
        .orderBy('date', 'asc');

    return trend;
}

module.exports = {
    getInventoryOverview,
    getLowStockProducts,
    adjustStock,
    getStockHistory,
    getStockTrend
};
