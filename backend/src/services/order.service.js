const knex = require('../database/knex');
const { v4: uuidv4 } = require('uuid');
const { sendOrderConfirmationEmail } = require('./email.service');
const voucherService = require('./voucher.service');
const stockHelper = require('./stock.helper');
const { SHIPPING } = require('../config/constants');


async function generateOrderCode(prefix = 'DL') {
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,''); 
  const last = await knex('orders')
    .where('order_code', 'like', `${prefix}${dateStr}%`)
    .orderBy('order_id', 'desc')
    .first();

  let seq = 1;
  if (last?.order_code) {
    seq = parseInt(last.order_code.slice(-3), 10) + 1;
  }
  return `${prefix}${dateStr}${String(seq).padStart(3, '0')}`;
}

async function createOrder(orderData, items) {
  const order_code = await generateOrderCode();
  const orderResult = await knex.transaction(async (trx) => {
    const sub_total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const shipping_fee = SHIPPING.STANDARD_FEE;
    
    let voucher_discount_amount = 0;
    let voucher_id = null;

    if (orderData.voucher_code) {
      try {
        const voucher = await voucherService.validateVoucher(
          orderData.voucher_code,
          orderData.user_id,
          sub_total
        );
        
        voucher_discount_amount = voucherService.calculateVoucherDiscount(
          voucher, 
          sub_total, 
          shipping_fee
        );
        voucher_id = voucher.voucher_id;

      } catch (error) {
        throw new Error(`Voucher error: ${error.message}`);
      }
    }

    const total_amount = sub_total + shipping_fee - voucher_discount_amount;

    const fullAddress = [
      orderData.shipping_detail_address,
      orderData.shipping_ward,
      orderData.shipping_province
    ].filter(Boolean).join(', ');
    // Tạo đơn hàng
    const [orderId] = await trx('orders').insert({
      user_id: orderData.user_id,
      order_status: 'pending',
      sub_total: sub_total,
      shipping_fee: shipping_fee,
      total_amount: total_amount,
      voucher_id: voucher_id,
      voucher_discount_amount: voucher_discount_amount,
      notes: orderData.notes ?? null,
      receiver_name: orderData.receiver_name,
      receiver_phone: orderData.receiver_phone,
      receiver_email: orderData.receiver_email,
      shipping_province: orderData.shipping_province,
      shipping_ward: orderData.shipping_ward,
      shipping_detail_address: orderData.shipping_detail_address,
      shipping_province_code: orderData.shipping_province_code,
      shipping_ward_code: orderData.shipping_ward_code,
      shipping_full_address: fullAddress,
      order_code: order_code,
    });


    await trx('payments').insert({
      order_id: orderId,
      payment_method: orderData.payment_method || 'cod',
      payment_status: 'pending',
      amount: total_amount
    });
    // Thêm chi tiết đơn hàng
    const orderItems = items.map(item => ({
      order_id: orderId,
      product_variant_id: item.product_variant_id,
      sub_total: item.price * item.quantity,
      quantity: item.quantity,
      price: item.price
    }));

    await trx('orderdetails').insert(orderItems);

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        throw new Error('Số lượng sản phẩm không hợp lệ');
      }


      const variant = await trx('product_variants')
        .where('product_variants_id', item.product_variant_id)
        .forUpdate() //lock row
        .first();


      if (!variant) {
        throw new Error('Sản phẩm không tồn tại hoặc đã ngừng bán');
      }

      if (variant.stock_quantity < qty) {
        throw new Error(`Sản phẩm không đủ tồn kho. Còn lại: ${variant.stock_quantity}, yêu cầu: ${qty}`);
      }

      await stockHelper.updateStock(trx, item.product_variant_id, -qty, {
        actionType: 'sale',
        adminId: null,
        reason: `Đơn hàng #${order_code}`,
        notes: `Bán ${qty} sản phẩm`
      });

    }


    return { 
      order_id: orderId,
      order_code,
      sub_total,
      shipping_fee,
      total_amount,
      voucher_id,
      voucher_discount_amount,
      payment_method: orderData.payment_method || 'cod',
      order_status: 'pending',
      ...orderData 
    };
  });


  if (orderResult.voucher_id) {
    await voucherService.useVoucher(
      orderResult.voucher_id,
      orderData.user_id,
      orderResult.order_id,
      orderResult.voucher_discount_amount
    );
  }

  (async () => {
    try {
      const fullOrderData = await knex('orders')
        .where('order_id', orderResult.order_id)
        .first();
      
      if (!fullOrderData) {
        console.warn(`Order #${orderResult.order_id} not found`);
        return;
      }

      const orderDetails = await knex('orderdetails')
        .join('product_variants','orderdetails.product_variant_id', 'product_variants.product_variants_id')
        .join('products','product_variants.product_id', 'products.product_id')
        .leftJoin('sizes','product_variants.size_id', 'sizes.size_id')
        .leftJoin('colors','product_variants.color_id', 'colors.color_id')
        .where('orderdetails.order_id', orderResult.order_id)
        .select(
          'products.name as product_name',
          'products.thumbnail',
          'colors.name as color_name',
          'sizes.name as size_name',
          'orderdetails.quantity',
          'orderdetails.price',
          'orderdetails.sub_total'
        );
      
      if (orderDetails.length === 0) {
        console.warn(`No order details found for order #${orderResult.order_id}`);
        return;
      }

      await sendOrderConfirmationEmail(fullOrderData, orderDetails);
      console.log(`email xác nhận đã gửi thành công cho đơn hàng #${orderResult.order_id}`);
    } catch (error) {
      console.error(`Lỗi gửi email cho đơn hàng #${orderResult.order_id}:`, error.message);
    }
  })();

  return orderResult;
}


async function getOrders(filters = {}, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  const query = knex('orders')
    .leftJoin('users', 'orders.user_id', 'users.user_id')
    .leftJoin('payments', 'orders.order_id', 'payments.order_id')
    .leftJoin('orderdetails', 'orders.order_id', 'orderdetails.order_id')
    .select([
      'orders.*',
      'users.username as customer_name',
      'users.email as customer_email',
      'payments.payment_method',
      'payments.payment_status',
      'payments.paid_at',
      knex.raw('COUNT(orderdetails.order_id) as items_count')
    ])
    .groupBy(
      'orders.order_id',
      'users.username',
      'users.email',
      'payments.payment_method',
      'payments.payment_status',
      'payments.paid_at'
    )
    .orderBy('orders.order_date', 'desc');


  if (filters.user_id) {
    query.where('orders.user_id', filters.user_id);
  }
  
  if (filters.order_status) {
    query.where('orders.order_status', filters.order_status);
  }

  if (filters.payment_status) {
    query.where('payments.payment_status', filters.payment_status);
  }

  if (filters.payment_method) {
    query.where('payments.payment_method', filters.payment_method);
  }

  if (filters.start_date && filters.end_date) {
    query.whereBetween('orders.order_date', [filters.start_date, filters.end_date]);
  }

  const countQuery = knex('orders')
    .leftJoin('payments', 'orders.order_id', 'payments.order_id')
    .where((builder) => {
      if (filters.user_id) {
        builder.where('orders.user_id', filters.user_id);
      }
      if (filters.order_status) {
        builder.where('orders.order_status', filters.order_status);
      }
      if (filters.payment_status) {
        builder.where('payments.payment_status', filters.payment_status);
      }
      if (filters.payment_method) {
        builder.where('payments.payment_method', filters.payment_method);
      }
      if (filters.start_date && filters.end_date) {
        builder.whereBetween('orders.order_date', [filters.start_date, filters.end_date]);
      }
    })
    .count('* as count')
    .first();
  
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


async function getOrderById(orderId) {
  const order = await knex('orders')
    .leftJoin('users', 'orders.user_id', 'users.user_id')
    .leftJoin('payments', 'orders.order_id', 'payments.order_id')
    .leftJoin('vouchers', 'orders.voucher_id', 'vouchers.voucher_id')
    .select([
      'orders.*',
      'users.username as customer_name',
      'users.email as customer_email',
      'users.phone as customer_phone',
      'payments.payment_method',
      'payments.payment_status',
      'payments.paid_at',
      'payments.payos_order_code',
      'payments.payos_transaction_id',
      'vouchers.code as voucher_code',
      'vouchers.name as voucher_name',
      'vouchers.discount_type as voucher_discount_type',
      'vouchers.discount_value as voucher_discount_value'
    ])
    .where('orders.order_id', orderId)
    .first();

  if (!order) return null;

  const items = await knex('orderdetails')
    .join('product_variants','orderdetails.product_variant_id', 'product_variants.product_variants_id')
    .join('products','product_variants.product_id', 'products.product_id')
    .leftJoin('sizes','product_variants.size_id', 'sizes.size_id')
    .leftJoin('colors','product_variants.color_id', 'colors.color_id')
    .select([
      'orderdetails.*',
      'products.product_id',
      'products.name as product_name',
      'sizes.name as size_name',
      'colors.name as color_name',
      'colors.hex_code as color_code',
      'orderdetails.discount_amount',
      'orderdetails.sub_total',
      'orderdetails.quantity',
      'orderdetails.price',
      'products.thumbnail as image_url'
    ])
    .where('orderdetails.order_id', orderId);

  return { ...order, items };
}


async function updateOrderStatus(orderId, order_status, adminId = null, cancelReason = null) {
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered'];
  
  if (!validStatuses.includes(order_status)) {
    throw new Error('Trạng thái đơn hàng không hợp lệ');
  }
  const order = await knex('orders').where({ order_id: orderId }).first();
  if (!order) throw new Error('Order not found');

  const patch = {
    order_status,
    updated_at: knex.fn.now(),
  };

  if (adminId) {
    patch.updated_by = adminId;
  }

  if (order_status === 'processing') {
    if (!order.processing_at) patch.processing_at = knex.fn.now();
  }
  
  if (order_status === 'shipped') {
    const payment = await knex('payments')
      .where('order_id', orderId)
      .first();
    
    if (payment) {
      const requirePrepayment = ['bank_transfer', 'payos', 'momo', 'vnpay'];
      
      if (requirePrepayment.includes(payment.payment_method) && payment.payment_status !== 'paid') {
        throw new Error(`Không thể giao hàng khi chưa thanh toán. Phương thức: ${payment.payment_method}, Trạng thái: ${payment.payment_status}`);
      }
    }
    
    if (!order.shipped_at) patch.shipped_at = knex.fn.now();
  }
  if (order_status === 'delivered') {
    if (!order.shipped_at) {
      throw new Error('Không thể đánh dấu delivered khi chưa shipped');
    }
    if (!order.delivered_at) patch.delivered_at = knex.fn.now();
    
    if (order.order_status !== 'delivered') {
      const orderItems = await knex('orderdetails')
        .where('order_id', orderId)
        .select('product_variant_id', 'quantity');
      
      for (const item of orderItems) {
        const variant = await knex('product_variants')
          .where('product_variants_id', item.product_variant_id)
          .select('product_id')
          .first();
        
        if (variant) {
          await knex('products')
            .where('product_id', variant.product_id)
            .increment('sold', item.quantity);
        }
      }
    }
  }

  const updated = await knex('orders')
    .where('order_id', orderId)
    .update(patch);

  return updated > 0;
}





async function cancelOrder(orderId, cancelReason = null) {
  return await knex.transaction(async (trx) => {
    const order = await trx('orders')
      .where({ order_id: orderId })
      .first();

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (order.order_status !== 'pending') {
      throw new Error('Chỉ có thể hủy đơn hàng đang chờ xử lý');
    }

    const payments = await trx('payments')
      .where({ order_id: orderId })
      .first();


    let newPaymentStatus = payments?.payment_status || 'pending';
    if (payments?.payment_status === 'paid') {
      newPaymentStatus = 'refunded';
    } else {
      newPaymentStatus = 'cancelled';
    }

    const updated = await trx('orders')
      .where({ order_id: orderId })
      .andWhere('order_status', 'pending')
      .update({
        order_status: 'cancelled',
        cancelled_at: trx.fn.now(),
        cancel_reason: cancelReason ?? null,
        updated_at: trx.fn.now(),
        updated_by: null
      });

    if (updated === 0) return false;

    await trx('payments')
        .where('order_id', orderId)
        .update({
          payment_status: newPaymentStatus,
          updated_at: trx.fn.now()
    });
    const orderItems = await trx('orderdetails')
      .where('order_id', orderId)
      .select('product_variant_id', 'quantity');

    for (const item of orderItems) {
      await stockHelper.updateStock(trx, item.product_variant_id, item.quantity, {
        actionType: 'order_cancelled',
        adminId: null,
        reason: `Hủy đơn hàng #${order.order_code || orderId}`,
        notes: cancelReason ? `Lý do: ${cancelReason}` : 'Hủy đơn hàng'
      });
      
      const variant = await trx('product_variants')
        .where('product_variants_id', item.product_variant_id)
        .select('product_id')
        .first();
      
      if (variant) {
        await trx('products')
          .where('product_id', variant.product_id)
          .decrement('sold', item.quantity);
      }
    }


    if (order.voucher_id) {
      await trx('vouchers')
        .where('voucher_id', order.voucher_id)
        .decrement('used_count', 1);
      
      await trx('user_vouchers')
        .where('user_id', order.user_id)
        .where('voucher_id', order.voucher_id)
        .decrement('used_count', 1);
      
      // await trx('order_vouchers')
      //   .where('order_id', orderId)
      //   .delete();
    }

    return true;
  });
}

async function getEligibleOrdersForReview(userId, productId) {
  const orders = await knex('orders')
    .select('orders.order_id', 'orders.order_date')
    .join('orderdetails', 'orders.order_id', 'orderdetails.order_id')
    .join('product_variants', 'orderdetails.product_variant_id', 'product_variants.product_variants_id')
    .leftJoin('product_reviews', function() {
      this.on('product_reviews.order_id', '=', 'orders.order_id')
          .andOn('product_reviews.product_id', '=', 'product_variants.product_id')
          .andOn('product_reviews.user_id', '=', 'orders.user_id');
    })
    .where('orders.user_id', userId)
    .andWhere('product_variants.product_id', productId)
    .andWhere('orders.order_status', 'delivered')
    .whereNull('product_reviews.id')
    .groupBy('orders.order_id')
    .orderBy('orders.order_date', 'desc');

  return orders;
}
//sẽ điều chỉnh sau
async function updateOrderAddress(orderId, userId, addressData) {
  const {
    receiver_name,
    receiver_phone,
    receiver_email,
    shipping_province,
    shipping_province_code,
    shipping_ward,
    shipping_ward_code,
    shipping_detail_address
  } = addressData;

  const order = await knex('orders')
    .where('order_id', orderId)
    .first();

  if (!order) {
    throw new Error('Không tìm thấy đơn hàng');
  }

  if (order.user_id !== userId) {
    throw new Error('Bạn không có quyền sửa đơn hàng này');
  }


  if (order.order_status !== 'pending') {
    throw new Error('Chỉ có thể sửa địa chỉ đơn hàng đang chờ duyệt');
  }

  const updated = await knex('orders')
    .where('order_id', orderId)
    .update({
      receiver_name,
      receiver_phone,
      receiver_email,
      shipping_province,
      shipping_province_code,
      shipping_ward,
      shipping_ward_code,
      shipping_detail_address,
      updated_at: knex.fn.now()
    });

  if (updated === 0) {
    throw new Error('Không thể cập nhật địa chỉ đơn hàng');
  }

  return await getOrderById(orderId);
}
module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getEligibleOrdersForReview,
  generateOrderCode,
  updateOrderAddress
};
