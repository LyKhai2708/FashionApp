const knex = require('../database/knex');
const Paginator = require('./paginator');
const stockHelper = require('./stock.helper');

async function createPurchaseOrder(userId, payload) {
    const { supplier_id, items, notes, expected_date } = payload;

    if (!items || items.length === 0) {
        throw new Error('Phiếu nhập phải có ít nhất 1 sản phẩm');
    }

    return await knex.transaction(async (trx) => {
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        const formattedDate = expected_date
            ? new Date(expected_date).toISOString().slice(0, 19).replace('T', ' ')
            : null;

        const [poId] = await trx('purchase_orders').insert({
            supplier_id,
            staff_id: userId,
            total_amount: totalAmount,
            status: 'pending',
            notes,
            expected_date: formattedDate
        });

        const poItems = items.map(item => ({
            po_id: poId,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price
        }));

        await trx('purchase_order_items').insert(poItems);

        return { po_id: poId, ...payload, total_amount: totalAmount, status: 'pending' };
    });
}

async function getPurchaseOrders(page = 1, limit = 10, status, supplierId) {
    const paginator = new Paginator(page, limit);

    let query = knex('purchase_orders as po')
        .join('suppliers as s', 'po.supplier_id', 's.supplier_id')
        .join('users as u', 'po.staff_id', 'u.user_id');

    if (status) {
        query = query.where('po.status', status);
    }

    if (supplierId) {
        query = query.where('po.supplier_id', supplierId);
    }

    const countQuery = query.clone().count('* as count').first();

    const orders = await query
        .select(
            'po.*',
            's.name as supplier_name',
            'u.username as staff_name'
        )
        .orderBy('po.created_at', 'desc')
        .limit(paginator.limit)
        .offset(paginator.offset);

    const { count } = await countQuery;

    return {
        metadata: paginator.getMetadata(parseInt(count) || 0),
        orders
    };
}

async function getPurchaseOrderById(id) {
    const order = await knex('purchase_orders as po')
        .join('suppliers as s', 'po.supplier_id', 's.supplier_id')
        .join('users as u', 'po.staff_id', 'u.user_id')
        .where('po.po_id', id)
        .select(
            'po.*',
            's.name as supplier_name',
            's.contact_name',
            's.phone as supplier_phone',
            'u.username as staff_name'
        )
        .first();

    if (!order) return null;

    const items = await knex('purchase_order_items as poi')
        .join('product_variants as pv', 'poi.product_variant_id', 'pv.product_variants_id')
        .join('products as p', 'pv.product_id', 'p.product_id')
        .join('sizes as sz', 'pv.size_id', 'sz.size_id')
        .join('colors as c', 'pv.color_id', 'c.color_id')
        .where('poi.po_id', id)
        .select(
            'poi.*',
            'p.name as product_name',
            'p.thumbnail',
            'sz.name as size_name',
            'c.name as color_name'
        );

    return { ...order, items };
}

async function updatePurchaseOrderStatus(id, status, userId) {
    const currentOrder = await knex('purchase_orders').where('po_id', id).first();

    if (!currentOrder) {
        throw new Error('Phiếu nhập không tồn tại');
    }

    if (currentOrder.status !== 'pending') {
        throw new Error('Chỉ có thể cập nhật trạng thái phiếu nhập đang chờ (pending)');
    }

    if (status === 'completed') {
        return await knex.transaction(async (trx) => {
            await trx('purchase_orders')
                .where('po_id', id)
                .update({ status: 'completed' });

            const items = await trx('purchase_order_items').where('po_id', id);

            for (const item of items) {
                await stockHelper.updateStock(trx, item.product_variant_id, item.quantity, {
                    actionType: 'restock',
                    adminId: userId,
                    reason: `Nhập kho từ phiếu nhập #${id}`,
                    referenceId: id,
                    referenceType: 'purchase_order'
                });
            }

            return true;
        });
    } else if (status === 'cancelled') {
        await knex('purchase_orders').where('po_id', id).update({ status: 'cancelled' });
        return true;
    } else {
        throw new Error('Trạng thái không hợp lệ');
    }
}

async function deletePurchaseOrder(id) {
    const order = await knex('purchase_orders').where('po_id', id).first();
    if (!order) return false;

    if (order.status !== 'pending' && order.status !== 'cancelled') {
        throw new Error('Không thể xóa phiếu nhập đã hoàn thành');
    }

    return knex('purchase_orders').where('po_id', id).del();
}

module.exports = {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrderStatus,
    deletePurchaseOrder
};
