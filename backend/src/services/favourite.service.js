const knex = require('../database/knex');
const Paginator = require('./paginator');

function favoriteRepository() {
    return knex('favorites');
}

async function getFavorites({ page = 1, limit = 10, user_id } = {}) {
    const paginator = new Paginator(page, limit);
    
    // Lấy promotion active cho mỗi product
    const promotionSubquery = knex.raw(
        `(SELECT pp.product_id, p.discount_percent
        FROM promotion_products pp
        JOIN promotions p ON pp.promo_id = p.promo_id
        WHERE p.active = TRUE
        AND p.start_date <= CURDATE()
        AND p.end_date >= CURDATE()) AS active_promotions`
    );

    // Query chính để lấy favorites
    let result = knex('favorites as f')
        .leftJoin('products as p', 'f.product_id', 'p.product_id')
        .leftJoin('brands as b', 'p.brand_id', 'b.id')
        .leftJoin(promotionSubquery, 'p.product_id', 'active_promotions.product_id')
        .leftJoin('categories as c', 'p.category_id', 'c.category_id')
        .where('f.user_id', user_id)
        .where('p.del_flag', 0)
        .select(
            knex.raw('count(f.favorite_id) OVER() AS recordCount'),
            'f.favorite_id',
            'f.product_id',
            'f.created_at as favorited_at',
            'p.name as product_name',
            'p.description',
            'p.base_price',
            'p.thumbnail',
            'p.sold',
            'p.slug',
            'b.name as brand_name',
            'c.name as category_name',
            'active_promotions.discount_percent',
            // Tính giá sau giảm
            knex.raw(`
                CASE 
                    WHEN active_promotions.discount_percent IS NOT NULL 
                    THEN ROUND(p.base_price * (1 - active_promotions.discount_percent / 100), 2)
                    ELSE p.base_price 
                END as discounted_price
            `),
            // Kiểm tra có promotion không
            knex.raw(`
                CASE 
                    WHEN active_promotions.discount_percent IS NOT NULL 
                    THEN true 
                    ELSE false 
                END as has_promotion
            `)
        )
        .orderBy('f.created_at', 'desc')
        .limit(paginator.limit)
        .offset(paginator.offset);

    const favorites = await result;
    
    if (favorites.length === 0) {
        return {
            metadata: paginator.getMetadata(0),
            favorites: [],
        };
    }

    let totalRecords = favorites[0].recordCount;
    const productIds = favorites.map(item => item.product_id);
    
    // Lấy màu sắc và ảnh chính của mỗi màu
    const productColors = await knex('product_colors as pc')
        .join('colors as c', 'pc.color_id', 'c.color_id')
        .leftJoin('images as img', function() {
            this.on('img.product_color_id', '=', 'pc.product_color_id')
                .andOn('img.is_primary', '=', knex.raw('TRUE'));
        })
        .whereIn('pc.product_id', productIds)
        .select(
            'pc.product_id',
            'c.color_id',
            'c.name as color_name',
            'c.hex_code',
            'pc.display_order',
            'img.image_url as primary_image'
        )
        .orderBy('pc.display_order')
        .orderBy('c.name');

    // Group colors by product_id
    const colorsByProduct = productColors.reduce((acc, color) => {
        if (!acc[color.product_id]) {
            acc[color.product_id] = [];
        }
        
        acc[color.product_id].push({
            color_id: color.color_id,
            name: color.color_name,
            hex_code: color.hex_code,
            primary_image: color.primary_image
        });
        return acc;
    }, {});

    // Format kết quả
    const formattedFavorites = favorites.map((item) => {
        delete item.recordCount;
        
        return {
            ...item,
            available_colors: colorsByProduct[item.product_id] || [],
            price_info: {
                base_price: parseFloat(item.base_price),
                discounted_price: parseFloat(item.discounted_price),
                discount_percent: item.discount_percent,
                has_promotion: item.has_promotion
            }
        };
    });
    
    return {
        metadata: paginator.getMetadata(totalRecords),
        favorites: formattedFavorites,
    };
}

async function deleteFavorite(user_id, product_id) {
    const deleted = await favoriteRepository()
        .where('user_id', user_id)
        .where('product_id', product_id)
        .del();
    return deleted;
}

async function addFavorite(user_id, product_id) {
    const added = await favoriteRepository().insert({ user_id, product_id });
    return added;
}

module.exports = {
    getFavorites,
    deleteFavorite,
    addFavorite
};