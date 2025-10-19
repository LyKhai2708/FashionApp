const knex = require('../database/knex');
const Paginator = require('./paginator');

function favoriteRepository() {
    return knex('favorites');
}

async function getFavorites(user_id, {page = 1, limit = 10} = {}, role = null) {
    const paginator = new Paginator(page, limit);


    const promotionSubquery = knex.raw(
        `(SELECT pp.product_id, p.discount_percent
        FROM promotion_products pp
        JOIN promotions p ON pp.promo_id = p.promo_id
        WHERE p.active = TRUE
        AND p.start_date <= CURDATE()
        AND p.end_date >= CURDATE()) AS active_promotions`
    );

    let result = knex('favorites as f')
        .leftJoin('products as p', 'f.product_id', 'p.product_id')
        .leftJoin('brand as b', 'p.brand_id', 'b.id')
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
            'c.category_name',
            'active_promotions.discount_percent',
            knex.raw(`
                CASE 
                    WHEN active_promotions.discount_percent IS NOT NULL 
                    THEN ROUND(p.base_price * (1 - active_promotions.discount_percent / 100), 2)
                    ELSE p.base_price 
                END as discounted_price
            `),

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
    

    const productColors = await knex('product_variants as pv')
        .join('colors as c', 'pv.color_id', 'c.color_id')
        .whereIn('pv.product_id', productIds)
        .select(
            'pv.product_id',
            'c.color_id',
            'c.name as color_name',
            'c.hex_code'
        )
        .groupBy('pv.product_id', 'c.color_id', 'c.name', 'c.hex_code')
        .orderBy('c.color_id');
    
    const primaryImages = await knex('images')
        .whereIn('product_id', productIds)
        .where('is_primary', true)
        .select('product_id', 'color_id', 'image_url');
    
    const primaryImageMap = {};
    for (const img of primaryImages) {
        const key = `${img.product_id}_${img.color_id}`;
        if (!primaryImageMap[key]) {
            primaryImageMap[key] = img.image_url;
        }
    }

    let queryVariant = knex('product_variants as pv')
        .join('sizes as s', 'pv.size_id', 's.size_id')
        .whereIn('pv.product_id', productIds)
        .select(
            'pv.product_variants_id as variant_id',
            'pv.product_id',
            'pv.color_id',
            'pv.size_id',
            's.name as size_name',
            'pv.stock_quantity'
        );
    
    if (role === 'admin') {
    } else {
        queryVariant = queryVariant.where('pv.active', '=', 1);
    }
    
    const productVariants = await queryVariant;

    const sizesByProductColor = productVariants.reduce((acc, variant) => {
        const key = `${variant.product_id}_${variant.color_id}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push({
            variant_id: variant.variant_id,
            size_id: variant.size_id,
            size_name: variant.size_name,
            stock_quantity: variant.stock_quantity
        });
        return acc;
    }, {});

    // Group colors by product_id
    const colorsByProduct = productColors.reduce((acc, color) => {
        if (!acc[color.product_id]) {
            acc[color.product_id] = [];
        }
        
        const key = `${color.product_id}_${color.color_id}`;
        acc[color.product_id].push({
            color_id: color.color_id,
            name: color.color_name,
            hex_code: color.hex_code,
            primary_image: primaryImageMap[key] || null,
            sizes: sizesByProductColor[key] || []
        });
        return acc;
    }, {});

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

async function addFavorite(user_id, product_id) {
    const [favorite_id] = await favoriteRepository().insert({ user_id, product_id });
    
    const favorite = await favoriteRepository()
        .where('favorite_id', favorite_id)
        .first();
        
    return favorite;
}

async function deleteFavoriteById(user_id, favorite_id) {
    const deleted = await favoriteRepository()
        .where('user_id', user_id)
        .where('favorite_id', favorite_id)
        .del();
    return deleted;
}

module.exports = {
    getFavorites,
    deleteFavoriteById,
    addFavorite
};