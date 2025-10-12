const knex = require('../database/knex');
const Paginator = require('./paginator');

async function getProductReview(productId,  page = 1, limit = 5, sortBy = 'newest', filterRating = 0){
    const paginator = new Paginator(page, limit);

     let query = knex('product_reviews')
        .innerJoin('users', 'product_reviews.user_id', 'users.user_id')
        .where('product_reviews.product_id', productId);

    if (filterRating > 0) {
        query = query.where('product_reviews.rating', filterRating);
    }
    
    if (sortBy === 'newest') {
        query = query.orderBy('product_reviews.created_at', 'desc');
    } else if (sortBy === 'oldest') {
        query = query.orderBy('product_reviews.created_at', 'asc');
    }

    let result = await query
    .select([
        knex.raw('count(id) OVER() AS recordCount'),
        'product_reviews.*',
        'users.username as customer_name',
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

    const ratingBreakdown = await knex('product_reviews')
    .where('product_id', productId)
    .select('rating')
    .count('* as ratingCount')
    .groupBy('rating');

    const ratingBreakdownObj = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    ratingBreakdown.forEach(item => {
        ratingBreakdownObj[item.rating] = parseInt(item.count);
    });
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
        total_reviews: stats[0].total_reviews,
        ratingBreakdown:  ratingBreakdownObj,
    }
}
async function createProductReview(userId, reviewData){
    const {product_id, order_id, rating, comment} = reviewData

     const order = await knex('orders')
        .where({
            order_id: order_id,
            user_id: userId,
            status: 'delivered'
        })
        .first();
    
    if (!order) {
        throw new Error('Đơn hàng không hợp lệ hoặc chưa được giao');
    }
    
    const orderDetail = await knex('orderdetails')
        .join('product_variants', 'orderdetails.product_variant_id', 'product_variants.product_variants_id')
        .where({
            'orderdetails.order_id': order_id,
            'product_variants.product_id': product_id
        })
        .first();
    
    if (!orderDetail) {
        throw new Error('Sản phẩm không có trong đơn hàng này');
    }
    
    const existingReview = await knex('product_reviews')
        .where({
            user_id: userId,
            product_id: product_id,
            order_id: order_id
        })
        .first();
    
    if (existingReview) {
        throw new Error('Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi');
    }
    const [result] = await knex('product_reviews').insert({
        user_id: userId,
        product_id,
        order_id,
        rating,
        comment,
        is_verified_purchase: true
    })
    return result;
}

async function updateProductReview(reviewId, userId, reviewData, isAdmin = false){
    const {rating, comment} = reviewData;
    
    let query = knex('product_reviews').where('id', reviewId);
    
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
