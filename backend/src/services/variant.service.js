const knex = require('../database/knex');
const Paginator = require('./paginator');

function variantRepository() {
    return knex('product_variants');
}

function readVariant(payload) {
    return {
        product_id: payload.product_id,
        size_id: payload.size_id,
        color_id: payload.color_id,
        stock_quantity: payload.stock_quantity || payload.stock || 0,
        active: payload.active !== undefined ? payload.active : 1
    };
}
//variants
async function addVariant(product_id, payload) {
    return await knex.transaction(async (trx) => {
        const variant = readVariant({ ...payload, product_id });
        
        // Kiểm tra xem product_color đã tồn tại chưa
        let productColor = await trx('product_colors')
            .where({
                product_id: product_id,
                color_id: variant.color_id
            })
            .first();
        
        // Nếu chưa có thì tạo mới product_color
        if (!productColor) {
            const [productColorId] = await trx('product_colors').insert({
                product_id: product_id,
                color_id: variant.color_id,
                display_order: 0
            });
            productColor = { product_color_id: productColorId };
        }
        
        // Thêm variant
        const [variant_id] = await trx('product_variants').insert(variant);
        
        return { ...variant, product_variants_id: variant_id };
    });
}
  
async function removeVariant(variantId) {
    // Kiểm tra variant có tồn tại không
    const existingVariant = await variantRepository()
        .where("product_variants_id", variantId)
        .first();
    
    if (!existingVariant) return false;
    
    // Xóa mềm: set active = 0
    const updated = await variantRepository()
        .where("product_variants_id", variantId)
        .update({active: 0});
    
    return updated > 0;
}

async function restoreVariant(variantId) {
    // Khôi phục variant
    const updated = await variantRepository()
        .where("product_variants_id", variantId)
        .update({active: 1});
    
    return updated > 0;
}

async function hardDeleteVariant(variantId) {
    const [orders] = await knex.raw(
        `SELECT COUNT(*) as count FROM orderdetails oi
         INNER JOIN product_variants pv ON oi.product_variant_id = pv.product_variants_id
         WHERE pv.product_variants_id = ?`,
        [variantId]
      );
    if (orders.count > 0) {
        throw new Error("Variant is in use and cannot be deleted");
    }
    const deleted = await variantRepository()
        .where("product_variants_id", variantId)
        .del();
    
    return deleted > 0;
}

async function updateVariant(variantId, payload) {
    return await knex.transaction(async (trx) => {
        // Lấy thông tin variant hiện tại
        const existingVariant = await trx('product_variants')
            .where("product_variants_id", variantId)
            .first();
        
        if (!existingVariant) {
            return null;
        }
        
        const variant = readVariant(payload);
        
        // Nếu color_id thay đổi, cần check product_color
        if (variant.color_id && variant.color_id !== existingVariant.color_id) {
            // Kiểm tra xem product_color mới đã tồn tại chưa
            let productColor = await trx('product_colors')
                .where({
                    product_id: existingVariant.product_id,
                    color_id: variant.color_id
                })
                .first();
            
            // Nếu chưa có thì tạo mới product_color
            if (!productColor) {
                await trx('product_colors').insert({
                    product_id: existingVariant.product_id,
                    color_id: variant.color_id,
                    display_order: 0
                });
            }
        }
        
        // Update variant
        const updated = await trx('product_variants')
            .where("product_variants_id", variantId)
            .update(variant);
        
        return updated ? { product_variants_id: variantId, ...variant } : null;
    });
}

module.exports = {
    addVariant,
    removeVariant,
    restoreVariant,
    hardDeleteVariant,
    updateVariant
};