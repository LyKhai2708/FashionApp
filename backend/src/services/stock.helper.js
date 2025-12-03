const knex = require('../database/knex');

async function updateStock(trx, variantId, quantityChange, options = {}) {
    const {
        actionType = 'adjustment',
        adminId = null,
        reason = null,
        notes = null,
        referenceId = null,
        referenceType = null
    } = options;

    if (quantityChange === 0) {
        throw new Error('Số lượng thay đổi phải khác 0');
    }

    const variant = await trx('product_variants')
        .where('product_variants_id', variantId)
        .forUpdate()
        .first();

    if (!variant) {
        throw new Error('Sản phẩm không tồn tại');
    }

    const quantityBefore = variant.stock_quantity;
    const quantityAfter = quantityBefore + quantityChange;

    if (quantityAfter < 0) {
        throw new Error(`Không đủ tồn kho. Còn lại: ${quantityBefore}, yêu cầu: ${Math.abs(quantityChange)}`);
    }

    await trx('product_variants')
        .where('product_variants_id', variantId)
        .update({
            stock_quantity: quantityAfter
        });

    await trx('stock_history').insert({
        product_variant_id: variantId,
        admin_id: adminId,
        action_type: actionType,
        quantity_before: quantityBefore,
        quantity_change: quantityChange,
        quantity_after: quantityAfter,
        reason: reason,
        notes: notes,
        reference_id: referenceId,
        reference_type: referenceType
    });

    return {
        quantityBefore,
        quantityAfter,
        quantityChange
    };
}

module.exports = {
    updateStock
};
