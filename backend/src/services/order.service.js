const knex = require('../database/knex');
const { v4: uuidv4 } = require('uuid');

/**
 * Tạo mới đơn hàng
 * @param {Object} orderData - Thông tin đơn hàng
 * @param {Array} items - Danh sách sản phẩm trong đơn hàng
 * @returns {Promise<Object>} Đơn hàng đã tạo
 */
async function createOrder(orderData, items) {
  return await knex.transaction(async (trx) => {
    // Tính toán tổng tiền
    const sub_total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping_fee = orderData.shipping_fee || 0;
    const total_amount = sub_total + shipping_fee;

    // Tạo đơn hàng
    const [orderId] = await trx('orders').insert({
      user_id: orderData.user_id,
      order_status: 'pending',
      sub_total: sub_total,
      shipping_fee: shipping_fee,
      total_amount: total_amount,
      payment_method: orderData.payment_method || 'cash_on_delivery',
      payment_status: 'unpaid',
      notes: orderData.notes,
      shipping_province: orderData.shipping_province,
      shipping_ward: orderData.shipping_ward,
      shipping_detail_address: orderData.shipping_detail_address,
      shipping_province_code: orderData.shipping_province_code,
      shipping_ward_code: orderData.shipping_ward_code,
    });

    // Thêm chi tiết đơn hàng
    const orderItems = items.map(item => ({
      order_id: orderId,
      product_variant_id: item.product_variant_id,
      quantity: item.quantity,
      price: item.price
    }));

    await trx('orderdetails').insert(orderItems);

    // Cập nhật số lượng tồn kho
    for (const item of items) {
      await trx('product_variants')
        .where('product_variants_id', item.product_variant_id)
        .decrement('stock', item.quantity);
    }

    return { 
      order_id: orderId, 
      sub_total,
      shipping_fee,
      total_amount,
      payment_method: orderData.payment_method || 'cash_on_delivery',
      payment_status: 'unpaid',
      order_status: 'pending',
      ...orderData 
    };
  });
}

/**
 * Lấy danh sách đơn hàng với phân trang và lọc
 * @param {Object} filters - Bộ lọc
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số lượng mỗi trang
 * @returns {Promise<Object>} Danh sách đơn hàng và thông tin phân trang
 */
async function getOrders(filters = {}, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  const query = knex('orders')
    .leftJoin('users', 'orders.user_id', 'users.user_id')
    .select([
      'orders.*',
      'users.fullname as customer_name',
      'users.email as customer_email'
    ])
    .orderBy('orders.order_date', 'desc');

  // Áp dụng bộ lọc
  if (filters.user_id) {
    query.where('orders.user_id', filters.user_id);
  }
  
  if (filters.order_status) {
    query.where('orders.order_status', filters.order_status);
  }

  if (filters.payment_status) {
    query.where('orders.payment_status', filters.payment_status);
  }

  if (filters.payment_method) {
    query.where('orders.payment_method', filters.payment_method);
  }

  if (filters.start_date && filters.end_date) {
    query.whereBetween('orders.order_date', [filters.start_date, filters.end_date]);
  }

  // Đếm tổng số bản ghi
  const countQuery = query.clone().clearSelect().count('* as count').first();
  
  // Phân trang
  query.offset(offset).limit(limit);

  const [orders, countResult] = await Promise.all([
    query,
    countQuery
  ]);

  const total = parseInt(countResult.count, 10);
  const totalPages = Math.ceil(total / limit);

  return {
    data: orders,
    pagination: {
      total,
      total_pages: totalPages,
      current_page: page,
      per_page: limit,
      has_next_page: page < totalPages,
      has_previous_page: page > 1
    }
  };
}

/**
 * Lấy chi tiết đơn hàng theo ID
 * @param {number} orderId - ID đơn hàng
 * @returns {Promise<Object>} Thông tin chi tiết đơn hàng
 */
async function getOrderById(orderId) {
  const order = await knex('orders')
    .leftJoin('users', 'orders.user_id', 'users.user_id')
    .select([
      'orders.*',
      'users.username as customer_name',
      'users.email as customer_email',
      'users.phone as customer_phone'
    ])
    .where('orders.order_id', orderId)
    .first();

  if (!order) return null;

  // Lấy chi tiết sản phẩm trong đơn hàng
  const items = await knex('orderdetails')
    .join('product_variants','orderdetails.product_variant_id', 'product_variants.product_variants_id')
    .join('products','product_variants.product_id', 'products.product_id')
    .leftJoin('sizes','product_variants.size_id', 'sizes.size_id')
    .leftJoin('colors','product_variants.color_id', 'colors.color_id')
    .select([
      'orderdetails.*',
      'products.name as product_name',
      'sizes.name as size_name',
      'colors.name as color_name',
      'colors.code as color_code',
      'orderdetails.discount_amount',
      'orderdetails.sub_total',
      'orderdetails.quantity',
      'orderdetails.price',
      'products.thumbnail as image_url'
    ])
    .where('orderdetails.order_id', orderId);

  return { ...order, items };
}


async function updateOrderStatus(orderId, order_status) {
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(order_status)) {
    throw new Error('Trạng thái đơn hàng không hợp lệ');
  }

  const [updated] = await knex('orders')
    .where('order_id', orderId)
    .update({ order_status });

  return updated > 0;
}

/**
 * Cập nhật trạng thái thanh toán
 * @param {number} orderId - ID đơn hàng
 * @param {string} payment_status - Trạng thái thanh toán
 * @returns {Promise<boolean>} Kết quả cập nhật
 */
async function updatePaymentStatus(orderId, payment_status) {
  const validStatuses = ['unpaid', 'paid', 'refund'];
  
  if (!validStatuses.includes(payment_status)) {
    throw new Error('Trạng thái thanh toán không hợp lệ');
  }

  const [updated] = await knex('orders')
    .where('order_id', orderId)
    .update({ payment_status });

  return updated > 0;
}

/**
 * Hủy đơn hàng
 * @param {number} orderId - ID đơn hàng
 * @returns {Promise<boolean>} Kết quả hủy đơn hàng
 */
async function cancelOrder(orderId) {
  return await knex.transaction(async (trx) => {
    // Cập nhật trạng thái đơn hàng
    const [updated] = await trx('orders')
    .update({order_status: 'cancelled'})
    .where('order_id', orderId)
    .andWhere('order_status', 'pending');

    if (updated === 0) return false;

    //cập nhật stock
    const orderItems = await trx('orderdetails')
      .where('order_id', orderId)
      .select('product_variant_id', 'quantity');

    for (const item of orderItems) {
      await trx('product_variants')
        .where('product_variants_id', item.product_variant_id)
        .increment('stock', item.quantity);
    }

    return true;
  });
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder
};
