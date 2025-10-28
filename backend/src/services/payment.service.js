const { PayOS } = require('@payos/node');
const knex = require('../database/knex');
const dotenv = require('dotenv');

dotenv.config();

const clientId = process.env.PAYOS_CLIENT_ID || '';
const apiKey = process.env.PAYOS_API_KEY || '';
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';
const payOS = new PayOS(clientId, apiKey, checksumKey);


async function handlePaymentSuccess(orderId, transactionId) {
  await knex.transaction(async (trx) => {
    await trx('payments')
      .where('order_id', orderId)
      .update({
        payment_status: 'paid',
        payos_transaction_id: transactionId,
        paid_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });

    await trx('orders')
      .where('order_id', orderId)
      .update({
        order_status: 'processing',
        updated_at: knex.fn.now()
      });

  });
}


async function handlePaymentFailed(orderId) {
  try {
    await knex('payments')
      .where('order_id', orderId)
      .update({
        payment_status: 'failed',
        failed_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    
    
    console.log(`Payment failed for order ${orderId} can retry until timeout`);
  } catch (error) {
    console.error('Error processing cancelled payment:', error);
    throw error;
  }
}

async function createPaymentLink(orderId, returnUrl, cancelUrl) {
  try {
    const order = await knex('orders').where('order_id', orderId).first();
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    if (order.order_status === 'cancelled') {
      throw new Error('Đơn hàng đã bị hủy');
    }

    const existingPayment = await knex('payments')
      .where('order_id', orderId)
      .first();

    let expireAt;

    if (existingPayment?.expire_at) {
      const oldExpireAt = new Date(existingPayment.expire_at);
      const now = new Date();
      
      if (oldExpireAt > now) {
        expireAt = oldExpireAt;
      } else {
        expireAt = new Date(Date.now() + 15 * 60 * 1000);
      }
    } else {
      expireAt = new Date(Date.now() + 15 * 60 * 1000);
    } 
    const orderData = await knex('orders')
    .leftJoin('users', 'orders.user_id', 'users.user_id')
    .leftJoin('payments', 'orders.order_id', 'payments.order_id')
    .select([
      'orders.*',
      'users.username',
      'payments.payment_id',
      'payments.payment_status',
      'payments.payment_method'
    ])
    .where('orders.order_id', orderId)
    .first();


    if (orderData.payment_status === 'paid') {
      throw new Error('Đơn hàng đã được thanh toán');
    }

    if (orderData.payment_method === 'cod') {
      throw new Error('Đơn hàng COD không cần tạo payment link');
    }

    const orderDetails = await knex('orderdetails')
      .select(
        'products.name as product_name',
        'sizes.name as size_name',
        'colors.name as color_name',
        'orderdetails.quantity',
        'orderdetails.price'
      )
      .leftJoin('product_variants', 'orderdetails.product_variant_id', 'product_variants.product_variants_id')
      .leftJoin('products', 'product_variants.product_id', 'products.product_id')
      .leftJoin('colors', 'product_variants.color_id', 'colors.color_id')
      .leftJoin('sizes', 'product_variants.size_id', 'sizes.size_id')
      .where('orderdetails.order_id', orderId);

    const orderCode = Math.floor(100000000 + Math.random() * 900000000);

    const items = orderDetails.map(item => ({
      name: `${item.product_name} - ${item.size_name || 'N/A'} - ${item.color_name || 'N/A'}`,
      quantity: item.quantity,
      price: Math.floor(item.price) 
    }));

    // PayOS yêu cầu description tối đa 25 ký tự
    const description = `DH ${orderData.order_code}`.substring(0, 25);

    const body = {
      orderCode,
      amount: Math.floor(orderData.total_amount),
      description,
      items,
      cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/orders/${orderId}?status=cancelled`,
      returnUrl: returnUrl || `${process.env.FRONTEND_URL}/orders/${orderId}?status=success`
    };

    const createPayment = await payOS.paymentRequests.create(body);

    await knex('payments')
    .where('order_id', orderId)
    .update({
      payos_order_code: orderCode,
      payos_checkout_url: createPayment.checkoutUrl,
      expire_at: expireAt,
      updated_at: knex.fn.now()
    });

    return {
      checkoutUrl: createPayment.checkoutUrl,
      orderCode,
      amount: orderData.total_amount,
      orderId,
      expireAt
    };

  } catch (error) {
    console.error('Create payment link error:', error);
    throw error;
  }
}


async function checkPayment(orderId) {
    const payment = await knex('payments')
    .where('order_id', orderId)
    .first();
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.payment_status === 'paid') {
      return { status: 'PAID', message: 'Đã thanh toán thành công' };
    }
    if (payment.payos_order_code) {
      try {
        const paymentInfo = await payOS.paymentRequests.get(payment.payos_order_code);
        
        if (paymentInfo.status === 'PAID') {
          await handlePaymentSuccess(orderId, paymentInfo.id);
          return { status: 'PAID', message: 'Thanh toán thành công' };
        } else if (paymentInfo.status === 'CANCELLED') {
          await handlePaymentFailed(orderId);
          return { status: 'CANCELLED', message: 'Thanh toán đã bị hủy' };
        }
        
        return { status: paymentInfo.status, message: 'Đang xử lý thanh toán' };
      } catch (error) {
        console.error('Check payment error:', error);
        throw new Error('Không thể kiểm tra trạng thái thanh toán');
      }
    }
  return { status: 'PENDING', message: 'Chờ thanh toán' };
}


async function cancelPayment(orderId) {
  const payment = await knex('payments')
    .where('order_id', orderId)
    .first();

  if (!payment) {
    throw new Error('Không tìm thấy thông tin thanh toán');
  }

  if (payment.payment_status === 'paid') {
    throw new Error('Không thể hủy thanh toán đã hoàn thành');
  }

  if (payment.payos_order_code) {
    try {
      await payOS.paymentRequests.cancel(payment.payos_order_code);
    } catch (error) {
      console.error('Cancel PayOS payment error:', error);
    }
  }

  await knex('payments')
    .where('order_id', orderId)
    .update({
      payment_status: 'cancelled',
      updated_at: knex.fn.now()
    });

  return { message: 'Đã hủy thanh toán thành công' };
}

const updatePaymentStatus = async (orderId, status, transactionId = null) => {
  const validStatuses = ['pending', 'paid', 'failed', 'cancelled', 'refunded'];
  
  if (!validStatuses.includes(status)) {
    throw new Error('Trạng thái thanh toán không hợp lệ');
  }

  const updateData = {
    payment_status: status,
    updated_at: knex.fn.now()
  };

  if (status === 'paid') {
    updateData.paid_at = knex.fn.now();
    if (transactionId) {
      updateData.payos_transaction_id = transactionId;
    }
  } else if (status === 'failed') {
    updateData.failed_at = knex.fn.now();
  }

  const updated = await knex('payments')
    .where('order_id', orderId)
    .update(updateData);

  return updated > 0;
};

const getPaymentByOrderId = async (orderId) => {
  return await knex('payments')
    .where('order_id', orderId)
    .first();
};

async function checkPendingPayments() {
  try {
    const pendingPayments = await knex('payments')
      .where('payment_status', 'pending')
      .where('payment_method', 'payos')
      .whereNotNull('payos_order_code')
      .whereNotNull('expire_at')
      .where('expire_at', '>', knex.fn.now())
      .select('order_id', 'payos_order_code');

    console.log(`[CRON] Checking ${pendingPayments.length} pending PayOS payments`);

    for (const payment of pendingPayments) {
      try {
        const paymentInfo = await payOS.paymentRequests.get(payment.payos_order_code);
        
        if (paymentInfo.status === 'PAID') {
          await handlePaymentSuccess(payment.order_id, paymentInfo.id);
          console.log(`payment ${payment.order_id} marked as PAID`);
        } else if (paymentInfo.status === 'CANCELLED') {
          await handlePaymentFailed(payment.order_id);
          console.log(`payment ${payment.order_id} marked as CANCELLED`);
        }
      } catch (error) {
        console.error(`Error checking payment ${payment.order_id}:`, error.message);
      }
    }

    return { checked: pendingPayments.length };
  } catch (error) {
    console.error('Error in checkPendingPayments:', error);
    throw error;
  }
}

async function cancelExpiredPayments() {
  try {
    const expiredPayments = await knex('payments')
      .join('orders', 'payments.order_id', 'orders.order_id')
      .where('orders.order_status', 'pending')
      .whereIn('payments.payment_status', ['pending', 'failed'])
      .whereNotNull('payments.expire_at')
      .where('payments.expire_at', '<', knex.fn.now())
      .select('orders.order_id', 'payments.payment_id');

    console.log(`Found ${expiredPayments.length} expired payments`);

    for (const payment of expiredPayments) {
      await knex.transaction(async (trx) => {
        const orderItems = await trx('orderdetails')
          .where('order_id', payment.order_id)
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

        await trx('orders')
          .where('order_id', payment.order_id)
          .update({
            order_status: 'cancelled',
            cancelled_at: knex.fn.now(),
            cancel_reason: 'Hết thời gian thanh toán',
            updated_at: knex.fn.now()
          });

        await trx('payments')
          .where('order_id', payment.order_id)
          .update({
            payment_status: 'cancelled',
            updated_at: knex.fn.now()
          });

        console.log(`Auto-cancelled expired payment for order ${payment.order_id} and restored stock`);
      });
    }

    return { cancelled: expiredPayments.length };
  } catch (error) {
    console.error('Error in cancelExpiredPayments:', error);
    throw error;
  }
}

module.exports = {
  createPaymentLink,
  checkPayment,
  cancelPayment,
  updatePaymentStatus,
  getPaymentByOrderId,
  handlePaymentSuccess,
  handlePaymentFailed,
  checkPendingPayments,
  cancelExpiredPayments
};
