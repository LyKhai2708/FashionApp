const knex = require('../database/knex');
const Paginator = require('./paginator');

function cartRepository() {
    return knex('cart');
}

async function getCart(userId) {
    const items = await knex('cart as c')
        .join('product_variants as pv', 'c.variant_id', 'pv.product_variants_id')
        .join('products as p', 'pv.product_id', 'p.product_id')
        .join('colors as col', 'pv.color_id', 'col.color_id')
        .join('sizes as s', 'pv.size_id', 's.size_id')
        .leftJoin('product_colors as pc', function() {
            this.on('pc.product_id', '=', 'p.product_id')
                .andOn('pc.color_id', '=', 'col.color_id');
        })
        .leftJoin('images as img', function() {
            this.on('img.product_color_id', '=', 'pc.product_color_id')
                .andOn('img.is_primary', '=', knex.raw('TRUE'));
        })
        .leftJoin(knex.raw(`
            (SELECT pp.product_id, pr.discount_percent
            FROM promotion_products pp
            JOIN promotions pr ON pp.promo_id = pr.promo_id
            WHERE pr.active = TRUE
            AND pr.start_date <= CURDATE()
            AND pr.end_date >= CURDATE()) AS active_promotions
        `), 'p.product_id', 'active_promotions.product_id')
        .where('c.user_id', userId)
        .where('p.del_flag', 0)
        .where('pv.active', 1)
        .select(
            'c.cart_id',
            'c.quantity',
            'c.added_at',
            'pv.product_variants_id as variant_id',
            'pv.stock_quantity',
            'p.product_id',
            'p.name as product_name',
            'p.base_price',
            'p.thumbnail',
            'col.color_id',
            'col.name as color_name',
            'col.hex_code as color_code',
            's.size_id',
            's.name as size_name',
            'img.image_url',
            'active_promotions.discount_percent',
            knex.raw(`
                CASE 
                    WHEN active_promotions.discount_percent IS NOT NULL 
                    THEN ROUND(p.base_price * (1 - active_promotions.discount_percent / 100), 2)
                    ELSE p.base_price 
                END as unit_price
            `)
        )
        .orderBy('c.added_at', 'desc');

    // Tính tổng tiền
    const total = items.reduce((sum, item) => {
        return sum + (parseFloat(item.unit_price) * item.quantity);
    }, 0);

    // Format items
    const formattedItems = items.map(item => ({
        cart_id: item.cart_id,
        quantity: item.quantity,
        added_at: item.added_at,
        variant: {
            variant_id: item.variant_id,
            stock_quantity: item.stock_quantity,
            color: {
                color_id: item.color_id,
                name: item.color_name,
                hex_code: item.color_code
            },
            size: {
                size_id: item.size_id,
                name: item.size_name
            }
        },
        product: {
            product_id: item.product_id,
            name: item.product_name,
            base_price: parseFloat(item.base_price),
            thumbnail: item.thumbnail,
            image_url: item.image_url,
            discount_percent: item.discount_percent || 0,
            unit_price: parseFloat(item.unit_price)
        },
        subtotal: parseFloat(item.unit_price) * item.quantity
    }));

    return {
        items: formattedItems,
        summary: {
            total_items: items.length,
            total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
            total_amount: Math.round(total * 100) / 100
        }
    };
}

async function addToCart(userId, cartData) {
    const { product_variant_id, quantity = 1 } = cartData;

    // Kiểm tra variant có tồn tại và còn hàng không
    const variant = await knex('product_variants as pv')
        .join('products as p', 'pv.product_id', 'p.product_id')
        .where('pv.product_variants_id', product_variant_id)
        .where('pv.active', 1)
        .where('p.del_flag', 0)
        .select('pv.stock_quantity', 'p.name as product_name')
        .first();

    if (!variant) {
        throw new Error('Sản phẩm không tồn tại hoặc đã ngừng bán');
    }

    if (variant.stock_quantity < quantity) {
        throw new Error(`Sản phẩm "${variant.product_name}" chỉ còn ${variant.stock_quantity} sản phẩm`);
    }

    // Kiểm tra đã có trong giỏ chưa
    const existingItem = await cartRepository()
        .where('user_id', userId)
        .where('product_variant_id', product_variant_id)
        .first();

    if (existingItem) {
        // Kiểm tra tổng số lượng sau khi cộng
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > variant.stock_quantity) {
            throw new Error(`Tổng số lượng vượt quá tồn kho. Còn lại: ${variant.stock_quantity}`);
        }

        // Cập nhật số lượng
        await cartRepository()
            .where('cart_id', existingItem.cart_id)
            .update({ quantity: newQuantity });
    } else {
        // Thêm mới vào giỏ
        await cartRepository().insert({
            user_id: userId,
            product_variant_id,
            quantity
        });
    }

    return await getCart(userId);
}

async function updateCartItem(userId, cartId, quantity) {
    if (quantity <= 0) {
        throw new Error('Số lượng phải lớn hơn 0');
    }

    // Kiểm tra cart item có thuộc về user không
    const cartItem = await knex('cart as c')
        .join('product_variants as pv', 'c.product_variant_id', 'pv.product_variants_id')
        .join('products as p', 'pv.product_id', 'p.product_id')
        .where('c.cart_id', cartId)
        .where('c.user_id', userId)
        .select('c.cart_id', 'pv.stock_quantity', 'p.name as product_name')
        .first();

    if (!cartItem) {
        throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
    }

    if (quantity > cartItem.stock_quantity) {
        throw new Error(`Sản phẩm "${cartItem.product_name}" chỉ còn ${cartItem.stock_quantity} sản phẩm`);
    }

    await cartRepository()
        .where('cart_id', cartId)
        .where('user_id', userId)
        .update({ quantity });

    return await getCart(userId);
}

async function removeFromCart(userId, cartId) {
    const deleted = await cartRepository()
        .where('cart_id', cartId)
        .where('user_id', userId)
        .del();

    if (deleted === 0) {
        throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
    }

    return await getCart(userId);
}

async function clearCart(userId) {
    await cartRepository().where('user_id', userId).del();
    return { message: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng' };
}

async function getCartItemCount(userId) {
    const result = await cartRepository()
        .where('user_id', userId)
        .sum('quantity as total_quantity')
        .first();
    
    return { count: parseInt(result.total_quantity) || 0 };
}

async function mergeLocalCartToCart(userId, items = []) {
    if (!items || items.length === 0) {
        return;
    }
    
    
    return knex.transaction(async (trx) => {
        const variantIds = items.map(item => item.product_variants_id);

        const existingItems = await trx('cart')
        .where('user_id', userId)
        .whereIn('product_variant_id', variantIds);

        const existingItemsMap = new Map(
            existingItems.map(item => [item.product_variant_id, item])
        );
        
        const itemsToUpdate = [];
        const itemsToInsert = [];

        for (const item of items) {
            const existing = existingItemsMap.get(item.product_variants_id);
            if (existing) {

                itemsToUpdate.push({
                    cart_id: existing.cart_id,
                    newQuantity: existing.quantity + item.quantity,
                });
            } else {

                itemsToInsert.push({
                    user_id: userId,
                    product_variant_id: item.product_variants_id,
                    quantity: item.quantity,
                    created_at: new Date(),
                });
            }
        }

        if (itemsToUpdate.length > 0) {
            await Promise.all(
                itemsToUpdate.map(item =>
                    trx('cart')
                        .where('cart_id', item.cart_id)
                        .update({ quantity: item.newQuantity })
                )
            );
        }

        if (itemsToInsert.length > 0) {
            await trx('cart').insert(itemsToInsert);
        }
    });
}

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartItemCount,
    mergeLocalCartToCart
};
