const knex = require('../database/knex');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');


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


function calculateShippingFee(subTotal) {
  const FREE_SHIP_THRESHOLD = 200000; // 200k
  const STANDARD_SHIPPING_FEE = 30000; // 30k
  
  return subTotal >= FREE_SHIP_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
}


async function createOrder(orderData, items) {
  const order_code = await generateOrderCode();
  const orderResult = await knex.transaction(async (trx) => {
    // Tính toán tổng tiền
    const sub_total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const shipping_fee = calculateShippingFee(sub_total);
    const total_amount = sub_total + shipping_fee;

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
      payment_method: orderData.payment_method || 'cash_on_delivery',
      payment_status: 'unpaid',
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

    // Thêm chi tiết đơn hàng
    const orderItems = items.map(item => ({
      order_id: orderId,
      product_variant_id: item.product_variant_id,
      sub_total: item.price * item.quantity,
      quantity: item.quantity,
      price: item.price
    }));

    await trx('orderdetails').insert(orderItems);

    // Cập nhật số lượng tồn kho
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        throw new Error('Số lượng sản phẩm không hợp lệ');
      }

   
      const updated = await trx('product_variants')
        .where('product_variants_id', item.product_variant_id)
        .andWhere('stock_quantity', '>=', qty)
        .decrement('stock_quantity', qty);


      const affectedRows = Array.isArray(updated) ? (Number(updated[0]) || 0) : Number(updated) || 0;
      if (affectedRows === 0) {
        throw new Error('Sản phẩm không đủ tồn kho, vui lòng giảm số lượng hoặc chọn biến thể khác');
      }

      const variant = await trx('product_variants')
        .where('product_variants_id', item.product_variant_id)
        .select('product_id')
        .first();

      if (variant) {
        await trx('products')
          .where('product_id', variant.product_id)
          .increment('sold', qty);
      }
    }

    return { 
      order_id: orderId,
      order_code,
      sub_total,
      shipping_fee,
      total_amount,
      payment_method: orderData.payment_method || 'cash_on_delivery',
      payment_status: 'unpaid',
      order_status: 'pending',
      ...orderData 
    };
  });

  sendOrderConfirmationEmail(
    orderResult.order_id, 
    { ...orderData, order_code },
    items, 
    orderResult.sub_total, 
    orderResult.shipping_fee, 
    orderResult.total_amount
  ).catch(err => {
    console.error('Email sending failed (non-blocking):', err.message);
  });

  return orderResult;
}

async function sendOrderConfirmationEmail(orderId, orderData, items, subTotal, shippingFee, totalAmount) {
  if (!orderData.receiver_email) {
    console.warn('No receiver_email provided. Skipping email.');
    return;
  } 
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Skipping email.');
    return;
  }

  try {
    const orderDetails = await knex('orderdetails as od')
      .join('product_variants as pv', 'od.product_variant_id', 'pv.product_variants_id')
      .join('products as p', 'pv.product_id', 'p.product_id')
      .leftJoin('colors as c', 'pv.color_id', 'c.color_id')
      .leftJoin('sizes as s', 'pv.size_id', 's.size_id')
      .where('od.order_id', orderId)
      .select(
        'p.name as product_name',
        'p.thumbnail',
        'c.name as color_name',
        's.name as size_name',
        'od.quantity',
        'od.price',
        'od.sub_total'
      );


    
    if (orderDetails.length === 0) {
      console.warn(`No order details found for order #${orderId}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const itemsHtml = orderDetails.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.product_name}<br>
          <small style="color: #666;">${item.color_name ? `Màu: ${item.color_name}` : ''} ${item.size_name ? `| Size: ${item.size_name}` : ''}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${item.price.toLocaleString('vi-VN')}₫<br>
          <small style="color: #666;">Tổng: ${item.sub_total.toLocaleString('vi-VN')}₫</small>
        </td>
      </tr>
    `).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: orderData.receiver_email,
      subject: `Xác nhận đơn hàng #${orderData.order_code} - DELULU Fashion`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f8f8; padding: 20px; text-align: center;">
            <h1 style="color: #8FD9FB; margin: 0;">DELULU FASHION</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2>Xin chào ${orderData.receiver_name}!</h2>
            <p>Cảm ơn bạn đã đặt hàng tại DELULU Fashion. Đơn hàng <strong>#${orderData.order_code}</strong> của bạn đã được đặt thành công và đang trong quá trình xử lý.</p>
            
            <h3>Chi tiết đơn hàng:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8f8f8;">
                  <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                  <th style="padding: 10px; text-align: center;">SL</th>
                  <th style="padding: 10px; text-align: right;">Giá</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 5px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Tạm tính:</span>
                <strong>${subTotal.toLocaleString('vi-VN')}₫</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Phí vận chuyển:</span>
                <strong>${shippingFee === 0 ? 'Miễn phí' : shippingFee.toLocaleString('vi-VN') + '₫'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd;">
                <span style="font-size: 18px;">Tổng cộng:</span>
                <strong style="font-size: 18px; color: #ef4444;">${totalAmount.toLocaleString('vi-VN')}₫</strong>
              </div>
            </div>
            
            <h3>Thông tin giao hàng:</h3>
            <p>
              <strong>Người nhận:</strong> ${orderData.receiver_name}<br>
              <strong>Số điện thoại:</strong> ${orderData.receiver_phone}<br>
              <strong>Địa chỉ:</strong> ${orderData.shipping_detail_address}, ${orderData.shipping_ward}, ${orderData.shipping_province}
            </p>
            
            <p><strong>Phương thức thanh toán:</strong> ${orderData.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}</p>
            
            <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">
              <p style="margin: 0;">💡 <strong>Lưu ý:</strong> Đơn hàng của bạn sẽ được xử lý trong vòng 24h. Nếu có thắc mắc, vui lòng liên hệ hotline: <strong>08966670687</strong></p>
            </div>
          </div>
          
          <div style="background: #f8f8f8; padding: 20px; text-align: center; margin-top: 20px;">
            <p style="margin: 0; color: #666;">© 2025 DELULU Fashion. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email xác nhận đã gửi thành công cho đơn hàng #${orderId}`);
  } catch (error) {
    console.error(`Lỗi gửi email cho đơn hàng #${orderId}:`, error.message);
    throw error;
  }
}


async function getOrders(filters = {}, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  const query = knex('orders')
    .leftJoin('users', 'orders.user_id', 'users.user_id')
    .leftJoin('orderdetails', 'orders.order_id', 'orderdetails.order_id')
    .select([
      'orders.*',
      'users.username as customer_name',
      'users.email as customer_email',
      knex.raw('COUNT(orderdetails.order_id) as items_count')
    ])
    .groupBy('orders.order_id')
    .orderBy('orders.order_date', 'desc');


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

  const countQuery = knex('orders')
    .where((builder) => {
      if (filters.user_id) {
        builder.where('user_id', filters.user_id);
      }
      if (filters.order_status) {
        builder.where('order_status', filters.order_status);
      }
      if (filters.payment_status) {
        builder.where('payment_status', filters.payment_status);
      }
      if (filters.payment_method) {
        builder.where('payment_method', filters.payment_method);
      }
      if (filters.start_date && filters.end_date) {
        builder.whereBetween('order_date', [filters.start_date, filters.end_date]);
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

  if (order_status === 'shipped') {
    if (!order.shipped_at) patch.shipped_at = knex.fn.now();
  }
  if (order_status === 'delivered') {
    if (!order.shipped_at) {
      throw new Error('Không thể đánh dấu delivered khi chưa shipped');
    }
    if (!order.delivered_at) patch.delivered_at = knex.fn.now();
  }

  const [updated] = await knex('orders')
    .where('order_id', orderId)
    .update(patch);

  return updated > 0;
}


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


async function cancelOrder(orderId, userId, cancelReason = null) {
  return await knex.transaction(async (trx) => {

    const order = await trx('orders')
      .where({ order_id: orderId })
      .first();

    if (!order) return false;

    if (order.user_id !== userId) {
      throw new Error('Bạn không có quyền hủy đơn hàng này');
    }

    if (order.order_status !== 'pending') {
      throw new Error('Đơn hàng không thể hủy khi không ở trạng thái pending');
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

  
    const orderItems = await trx('orderdetails')
      .where('order_id', orderId)
      .select('product_variant_id', 'quantity');

    for (const item of orderItems) {
      await trx('product_variants')
        .where('product_variants_id', item.product_variant_id)
        .increment('stock_quantity', item.quantity);
      
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
module.exports = {
  createOrder,
  getOrders,
  calculateShippingFee,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getEligibleOrdersForReview,
  generateOrderCode
};
