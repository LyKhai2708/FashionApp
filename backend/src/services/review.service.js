const knex = require('../database/knex');
const Paginator = require('./paginator');

async function getProductReview(productId,  page = 1, limit = 5){
    const paginator = new Paginator(page, limit);
    let result = await knex('product_reviews')
    .innerJoin('users', 'product_reviews.user_id', 'users.user_id')
    .where('product_id', productId)
    .select([
        knex.raw('count(id) OVER() AS recordCount'),
        'product_reviews.*',
        'users.fullname as customer_name',
        'users.email as customer_email',
        'users.phone as customer_phone'
    ]).limit(paginator.limit)
    .offset(paginator.offset);;

    const [stats] = await knex('product_reviews')
    .where('product_id', productId)
    .select([
        knex.raw('COUNT(*) as total_reviews'),
        knex.raw('AVG(rating) as average_rating')
    ]);


    let totalRecords = 0;
    result = result.map((item) => {
        totalRecords = item.recordCount;
        delete item.recordCount;
        return item;
    });
    return {
        reviews: result,
        metadata: paginator.getMetadata(totalRecords),
        average_rating: stats[0].average_rating,
        total_reviews: stats[0].total_reviews
    }
}
async function createProductReview(userId, reviewData){
    const {product_id, order_id, rating, comment} = reviewData

    //kiem tra san pham duoc mua chua
    const [orders] = await knex('order_details')
    .innerJoin('orders', 'order_details.order_id', 'orders.order_id')
    .innerJoin('product_variants', 'order_details.product_variant_id', 'product_variants.product_variant_id')
    .select([
        knex.raw('COUNT(*) as count'),
    ])
    .where('orders.user_id', userId)
    .where('product_variants.product_id', product_id)
    .where('orders.order_id', order_id);
    if (orders[0].count === 0) {
        throw new Error('Bạn chưa mua sản phẩm này không thể đánh giá');
    }

    const existingReview = await knex('product_reviews')
    .where('user_id', userId)
    .where('product_id', product_id)
    .where('order_id', order_id)
    .first();
    
    if (existingReview) {
        throw new Error('Bạn đã đánh giá sản phẩm này rồi');
    }
    const [result] = await knex('product_reviews').insert({
        user_id: userId,
        product_id,
        order_id,
        rating,
        comment
    })
    return result;
}

async function updateProductReview(reviewId, userId, reviewData, isAdmin = false){
    const {rating, comment} = reviewData;
    
    let query = knex('product_reviews').where('id', reviewId);
    
    // Nếu không phải admin thì chỉ cho phép update review của chính mình
    if (!isAdmin) {
        query = query.where('user_id', userId);
    }
    
    const [result] = await query.update({
        rating,
        comment,
        updated_at: knex.fn.now()
    });
    
    return result;
}

async function deleteProductReview(reviewId, userId, isAdmin){
    const query = knex('product_reviews').where('id', reviewId)
    if(!isAdmin){
        query = query.where('user_id', userId)
    }
    const [result] = await query.del()
    return result;
}
module.exports = {
    getProductReview,
    createProductReview,
    updateProductReview,
    deleteProductReview
}
