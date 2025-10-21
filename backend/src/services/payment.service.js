const PayOS = require('@payos/node');
const NodeCache = require('node-cache');
const knex = require('../database/knex');
const dotenv = require('dotenv');

dotenv.config();

const clientId = process.env.PAYOS_CLIENT_ID || '';
const apiKey = process.env.PAYOS_API_KEY || '';
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';
const payOS = new PayOS(clientId, apiKey, checksumKey);

const cache = new NodeCache({ checkperiod: 120, deleteOnExpire: true });


const paymentCallback = async (key, value) => {
  const data = value;
  try {
    const paymentInfo = await payOS.getPaymentLinkInformation(data.orderCode);
    if (paymentInfo.status === 'PAID') {
      await handlePaymentSuccess(data.orderId, paymentInfo.id);
    } else if (paymentInfo.status === 'CANCELLED') {
      await handlePaymentFailed(data.orderId);
    }
  } catch (error) {
    console.error('Payment callback error:', error);
  }
};

cache.on('expired', paymentCallback);


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

    const orderItems = await trx('orderdetails')
      .where('order_id', orderId)
      .select('product_variant_id', 'quantity');

    for (const item of orderItems) {
      const qty = Number(item.quantity) || 0;
      
      const updated = await trx('product_variants')
        .where('product_variants_id', item.product_variant_id)
        .andWhere('stock_quantity', '>=', qty)
        .decrement('stock_quantity', qty);

      const affectedRows = Array.isArray(updated) ? (Number(updated[0]) || 0) : Number(updated) || 0;
      if (affectedRows === 0) {
        console.error(`Không đủ stock cho variant ${item.product_variant_id}, quantity: ${qty}`);
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

    await knex('orders')
    .where('order_id', orderId)
    .update({
      order_status: 'cancelled',
      cancelled_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
    console.log(`Payment failed for order ${orderId}`);
  } catch (error) {
    console.error('Error processing cancelled payment:', error);
    throw error;
  }
}

async function createPaymentLink(orderId, returnUrl, cancelUrl) {
  try {
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

    if (!orderData) {
      throw new Error('Đơn hàng không tồn tại');
    }

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

    const description = `Thanh toán đơn hàng ${orderData.order_code} - ${orderData.username}`;

    const body = {
      orderCode,
      amount: Math.floor(orderData.total_amount),
      description,
      items,
      cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/orders/${orderId}?status=cancelled`,
      returnUrl: returnUrl || `${process.env.FRONTEND_URL}/orders/${orderId}?status=success`
    };

    const createPayment = await payOS.createPaymentLink(body);

    await knex('payments')
    .where('order_id', orderId)
    .update({
      payos_order_code: orderCode,
      payos_checkout_url: createPayment.checkoutUrl,
      updated_at: knex.fn.now()
    });

    cache.set(`payment_${orderId}`, {
    orderId,
    orderCode: orderCode
    }, 900);

    

    return {
      checkoutUrl: createPayment.checkoutUrl,
      orderCode,
      amount: orderData.total_amount,
      orderId
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
        const paymentInfo = await payOS.getPaymentLinkInformation(payment.payos_order_code);
        
        if (paymentInfo.status === 'PAID') {
          await handlePaymentSuccess(orderId, paymentInfo.id);
          cache.del(`payment_${orderId}`);
          return { status: 'PAID', message: 'Thanh toán thành công' };
        } else if (paymentInfo.status === 'CANCELLED') {
          await handlePaymentFailed(orderId);
          cache.del(`payment_${orderId}`);
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
      await payOS.cancelPaymentLink(payment.payos_order_code);
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

  cache.del(`payment_${orderId}`);

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
module.exports = {
  createPaymentLink,
  checkPayment,
  cancelPayment,
  updatePaymentStatus,
  getPaymentByOrderId,
  handlePaymentSuccess,
  handlePaymentFailed
};
