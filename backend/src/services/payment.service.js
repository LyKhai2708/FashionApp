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
  try {
    const data = value;
    const paymentInfo = await payOS.getPaymentLinkInformation(data.orderCode);
    
    if (paymentInfo.status === 'PAID') {
      await processSuccessfulPayment(data, paymentInfo);
    } else if (paymentInfo.status === 'CANCELLED') {
      await processCancelledPayment(data);
    }
  } catch (error) {
    console.error('Payment callback error:', error);
  }
};

// Đăng ký event expired
cache.on('expired', paymentCallback);

/**
 * Xử lý payment thành công
 */
async function processSuccessfulPayment(paymentData, paymentInfo) {
  const trx = await knex.transaction();
  
  try {
    // Cập nhật trạng thái đơn hàng
    await trx('orders')
      .where('order_id', paymentData.orderId)
      .update({
        order_status: 'confirmed',
        payment_status: 'paid',
        updated_at: new Date()
      });

    // Tạo bản ghi payment
    await trx('payments').insert({
      order_id: paymentData.orderId,
      payment_method: 'payos',
      payment_status: 'completed',
      amount: paymentInfo.amount,
      transaction_id: paymentData.orderCode.toString(),
      payment_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });

    // Giảm stock cho các sản phẩm trong đơn hàng
    const orderDetails = await trx('orderdetails')
      .where('order_id', paymentData.orderId);

    for (const detail of orderDetails) {
      await trx('product_variants')
        .where('variant_id', detail.variant_id)
        .decrement('stock_quantity', detail.quantity);
    }

    await trx.commit();
    console.log(`Payment processed successfully for order ${paymentData.orderId}`);
    
  } catch (error) {
    await trx.rollback();
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

/**
 * Xử lý payment bị hủy
 */
async function processCancelledPayment(paymentData) {
  try {
    // Cập nhật trạng thái đơn hàng thành cancelled
    await knex('orders')
      .where('order_id', paymentData.orderId)
      .update({
        order_status: 'cancelled',
        payment_status: 'failed',
        updated_at: new Date()
      });

    console.log(`Payment cancelled for order ${paymentData.orderId}`);
  } catch (error) {
    console.error('Error processing cancelled payment:', error);
    throw error;
  }
}

/**
 * Tạo payment link cho đơn hàng
 */
async function createPaymentLink(request) {
  try {
    // Lấy thông tin đơn hàng
    const order = await knex('orders')
      .select('orders.*', 'users.full_name', 'users.email')
      .leftJoin('users', 'orders.user_id', 'users.user_id')
      .where('orders.order_id', request.orderId)
      .first();

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.payment_status === 'paid') {
      throw new Error('Order already paid');
    }

    const orderDetails = await knex('orderdetails')
      .select(
        'orderdetails.*',
        'products.product_name',
        'colors.color_name',
        'sizes.size_name'
      )
      .leftJoin('product_variants', 'orderdetails.variant_id', 'product_variants.variant_id')
      .leftJoin('products', 'product_variants.product_id', 'products.product_id')
      .leftJoin('colors', 'product_variants.color_id', 'colors.color_id')
      .leftJoin('sizes', 'product_variants.size_id', 'sizes.size_id')
      .where('orderdetails.order_id', request.orderId);

    const orderCode = Math.floor(100000000 + Math.random() * 900000000);

    // Tạo items cho PayOS
    const items = orderDetails.map(detail => ({
      name: `${detail.product_name} - ${detail.color_name} - ${detail.size_name}`,
      quantity: detail.quantity,
      price: Math.floor(detail.price) 
    }));

    // Thêm phí ship nếu có
    if (order.shipping_fee > 0) {
      items.push({
        name: 'Phí vận chuyển',
        quantity: 1,
        price: Math.floor(order.shipping_fee)
      });
    }

    const description = `Thanh toán đơn hàng ${order.order_code}`;

    const body = {
      orderCode,
      amount: Math.floor(order.total_amount),
      description,
      items,
      cancelUrl: request.cancelUrl || `${process.env.FRONTEND_URL}/orders/${order.order_id}`,
      returnUrl: request.returnUrl || `${process.env.FRONTEND_URL}/payment/success/${order.order_id}`
    };

    const createPayment = await payOS.createPaymentLink(body);

    // Lưu thông tin vào cache với TTL 15 phút
    const paymentData = {
      orderId: request.orderId,
      orderCode,
      userId: order.user_id,
      amount: order.total_amount
    };

    cache.set(`payment_${request.orderId}`, paymentData, 900); // 15 phút

    // Cập nhật order với payment info
    await knex('orders')
      .where('order_id', request.orderId)
      .update({
        payment_status: 'pending',
        updated_at: new Date()
      });

    return {
      checkoutUrl: createPayment.checkoutUrl,
      orderCode,
      qrCode: createPayment.qrCode
    };

  } catch (error) {
    console.error('Create payment link error:', error);
    throw error;
  }
}

/**
 * Kiểm tra trạng thái payment
 */
async function checkPaymentStatus(orderId) {
  try {
    const paymentData = cache.get(`payment_${orderId}`);
    
    if (!paymentData) {
      const order = await knex('orders')
        .where('order_id', orderId)
        .first();
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      return {
        status: order.payment_status,
        orderStatus: order.order_status
      };
    }

    const paymentInfo = await payOS.getPaymentLinkInformation(paymentData.orderCode);
    
    if (paymentInfo.status === 'PAID') {
      await processSuccessfulPayment(paymentData, paymentInfo);
      cache.del(`payment_${orderId}`);
      
      return {
        status: 'paid',
        orderStatus: 'confirmed',
        transactionId: paymentData.orderCode,
        amount: paymentInfo.amount
      };
    } else if (paymentInfo.status === 'CANCELLED') {
      await processCancelledPayment(paymentData);
      cache.del(`payment_${orderId}`);
      
      return {
        status: 'cancelled',
        orderStatus: 'cancelled'
      };
    }

    return {
      status: 'pending',
      orderStatus: 'pending'
    };

  } catch (error) {
    console.error('Check payment status error:', error);
    throw error;
  }
}

/**
 * Hủy payment link
 */
async function cancelPaymentLink(orderId) {
  try {
    const paymentData = cache.get(`payment_${orderId}`);
    
    if (paymentData) {
      await payOS.cancelPaymentLink(paymentData.orderCode);
      cache.del(`payment_${orderId}`);
    }

    // Cập nhật trạng thái đơn hàng
    await knex('orders')
      .where('order_id', orderId)
      .update({
        order_status: 'cancelled',
        payment_status: 'cancelled',
        updated_at: new Date()
      });

    return { success: true };

  } catch (error) {
    console.error('Cancel payment link error:', error);
    throw error;
  }
}

/**
 * Webhook handler cho PayOS
 */
async function handleWebhook(webhookData) {
  try {
    // Verify webhook signature nếu cần
    const { orderCode, status, amount } = webhookData;
    
    // Tìm payment data trong cache
    const cacheKeys = cache.keys();
    let paymentData = null;
    
    for (const key of cacheKeys) {
      const data = cache.get(key);
      if (data && data.orderCode === orderCode) {
        paymentData = data;
        break;
      }
    }

    if (!paymentData) {
      console.log('Payment data not found in cache for orderCode:', orderCode);
      return;
    }

    if (status === 'PAID') {
      await processSuccessfulPayment(paymentData, { amount, status });
      cache.del(`payment_${paymentData.orderId}`);
    } else if (status === 'CANCELLED') {
      await processCancelledPayment(paymentData);
      cache.del(`payment_${paymentData.orderId}`);
    }

    return { success: true };

  } catch (error) {
    console.error('Webhook handler error:', error);
    throw error;
  }
}

module.exports = {
  createPaymentLink,
  checkPaymentStatus,
  cancelPaymentLink,
  handleWebhook
};
