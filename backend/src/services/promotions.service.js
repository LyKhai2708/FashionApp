const knex = require('../database/knex');
const Paginator = require('./paginator');
function promotionRepository() {
    return knex('promotions');
}

function readPromotion(payload) {
    const promotion = {
        promo_id: payload.promo_id,
        name: payload.name,
        discount_percent: payload.discount_percent,
        start_date: payload.start_date,
        end_date: payload.end_date,
        active: payload.active,
    }
    return promotion;
}

async function createPromotion(payload) {
    const promotion = readPromotion(payload);
    const [id] = await promotionRepository().insert(promotion);
    return { promo_id: id, ...promotion };
}


async function getManyPromotion(payload){
    const {page = 1, limit = 10, promo_name, active, start_date, end_date} = payload;
    const paginator = new Paginator(page, limit);
    let result = promotionRepository().where((builder) => {
        if(promo_name){
            builder.whereILike('name', `%${promo_name}%`);
        }
        if(active !== undefined){
            builder.where('active', active);
        }
        if(start_date){
            builder.where('start_date', '>=', start_date);
        }
        if(end_date){
            builder.where('end_date', '<=', end_date);
        }
    }).select(
        knex.raw('count(promo_id) OVER() AS recordCount'),
        'promo_id',
        'name',
        'discount_percent',
        'start_date',
        'end_date',
        'active'
    ).limit(paginator.limit).offset(paginator.offset);
    
    let totalRecords = 0;
    result = (await result).map((result) => {
        totalRecords = result.recordCount;
        delete result.recordCount;
        return result;
    });
    
    return {
        metadata: paginator.getMetadata(totalRecords),
        promotions: result,
    };
}

async function addProductToPromotion(productId, promoId) {
    // Kiểm tra promotion có tồn tại không
    const promotion = await knex('promotions')
        .where('promo_id', promoId)
        .where('active', true)
        .first();
        
    if (!promotion) {
        throw new Error('Promotion không tồn tại');
    }

    // Kiểm tra product đã có promotion active chưa
    const existingPromo = await knex('promotion_products as pp')
        .join('promotions as p', 'pp.promo_id', 'p.promo_id')
        .where('pp.product_id', productId)
        .where('p.active', true)
        .first();

    if (existingPromo) {
        throw new Error(`Sản phẩm đã có promotion: ${existingPromo.name}`);
    }

    // Thêm promotion mới
    return knex('promotion_products').insert({
        product_id: productId,
        promo_id: promoId
    });
}

async function removeProductFromPromotion(productId) {
    // Kiểm tra product có promotion không
    const activePromo = await knex('promotion_products as pp')
        .join('promotions as p', 'pp.promo_id', 'p.promo_id')
        .where('pp.product_id', productId)
        .where('p.active', true)
        .first();

    if (!activePromo) {
        throw new Error('Sản phẩm không có promotion nào');
    }

    return knex('promotion_products')
        .where('product_id', productId)
        .where('promo_id', activePromo.promo_id)
        .del();
}

async function getManyProductInPromotion(payload){
    const {page = 1, limit = 10, promo_id} = payload;
    const paginator = new Paginator(page, limit);
    
    let result = knex('promotion_products as pp')
        .join('promotions as p', 'pp.promo_id', 'p.promo_id')
        .join('products as prod', 'pp.product_id', 'prod.product_id')
        .leftJoin('brand as b', 'prod.brand_id', 'b.id')
        .leftJoin('categories as c', 'prod.category_id', 'c.category_id')
        .where('pp.promo_id', promo_id)
        .where('prod.del_flag', 0)
        .select(
            knex.raw('count(pp.product_id) OVER() AS recordCount'),
            // Product info
            'prod.product_id',
            'prod.name as product_name',
            'prod.base_price',
            'prod.thumbnail',
            'prod.sold',
            'prod.slug',
            'b.name as brand_name',
            'c.category_name',
            // Promotion info
            'p.promo_id',
            'p.name as promo_name',
            'p.discount_percent',
            'p.start_date',
            'p.end_date',
            'p.active',
            knex.raw('ROUND(prod.base_price * (1 - p.discount_percent / 100), 2) as discounted_price')
        )
        .orderBy('prod.name')
        .limit(paginator.limit)
        .offset(paginator.offset);
    
    const products = await result;
    
    if (products.length === 0) {
        return {
            metadata: paginator.getMetadata(0),
            products: [],
        };
    }

    let totalRecords = products[0].recordCount;
    
    // Lấy màu sắc available cho mỗi sản phẩm
    const productIds = products.map(item => item.product_id);
    const availableColors = await knex('product_variants as pv')
        .join('colors as c', 'pv.color_id', 'c.color_id')
        .whereIn('pv.product_id', productIds)
        .where('pv.stock_quantity', '>', 0)
        .select('pv.product_id', 'c.color_id', 'c.name as color_name', 'c.hex_code')
        .orderBy('c.name');

    // Group colors by product_id
    const colorsByProduct = availableColors.reduce((acc, color) => {
        if (!acc[color.product_id]) {
            acc[color.product_id] = [];
        }
        acc[color.product_id].push({
            color_id: color.color_id,
            name: color.color_name,
            hex_code: color.hex_code
        });
        return acc;
    }, {});
    
    // Format kết quả
    const formattedProducts = products.map((item) => {
        delete item.recordCount;
        return {
            ...item,
            available_colors: colorsByProduct[item.product_id] || [],
            price_info: {
                base_price: parseFloat(item.base_price),
                discounted_price: parseFloat(item.discounted_price),
                discount_percent: item.discount_percent,
            }
        };
    });
    
    return {
        metadata: paginator.getMetadata(totalRecords),
        products: formattedProducts,
    };
}

async function deactivatePromotion(promoId) {
    const promotion = await knex('promotions')
        .where('promo_id', promoId)
        .first();
        
    if (!promotion) {
        throw new Error('Promotion không tồn tại');
    }
    
    if (!promotion.active) {
        throw new Error('Promotion đã inactive rồi');
    }

    return knex('promotions')
        .where('promo_id', promoId)
        .update({ active: false });
}


module.exports = {
    createPromotion,
    getManyPromotion,
    addProductToPromotion,
    removeProductFromPromotion,
    getManyProductInPromotion,
    deactivatePromotion,
};