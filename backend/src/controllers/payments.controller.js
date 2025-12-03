const paymentService = require('../services/payment.service');
const orderService = require('../services/order.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

class PaymentController {
  async createPaymentLink(req, res, next) {
    try {
      const { orderId, returnUrl, cancelUrl } = req.body;
      const userId = req.user.id;

      if (!orderId) {
        return next(new ApiError(400, 'Order ID là bắt buộc'));
      }

      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return next(new ApiError(404, 'Không tìm thấy đơn hàng'));
      }

      if (order.user_id !== userId) {
        return next(new ApiError(403, 'Bạn chỉ có thể tạo link thanh toán cho đơn hàng của mình'));
      }

      const result = await paymentService.createPaymentLink(orderId, returnUrl, cancelUrl);
      return res.status(200).json(JSend.success(result));
    } catch (error) {
      console.error('Create payment error:', error);
      return next(new ApiError(500, error.message));
    }
  }

  async checkPaymentStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return next(new ApiError(404, 'Không tìm thấy đơn hàng'));
      }

      // Only order owner can check payment status
      if (order.user_id !== userId) {
        return next(new ApiError(403, 'Bạn chỉ có thể kiểm tra thanh toán của đơn hàng mình'));
      }

      const result = await paymentService.checkPayment(parseInt(orderId));
      return res.status(200).json(JSend.success(result));
    } catch (error) {
      console.error('Check payment error:', error);
      return next(new ApiError(500, error.message));
    }
  }

  async cancelPayment(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return next(new ApiError(404, 'Không tìm thấy đơn hàng'));
      }

      if (order.user_id !== userId) {
        return next(new ApiError(403, 'Bạn chỉ có thể hủy thanh toán của đơn hàng mình'));
      }

      const result = await paymentService.cancelPayment(parseInt(orderId));
      return res.status(200).json(JSend.success(result));
    } catch (error) {
      console.error('Cancel payment error:', error);
      return next(new ApiError(500, error.message));
    }
  }

  async updatePaymentStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const { payment_status, transaction_id } = req.body;

      if (!payment_status) {
        return next(new ApiError(400, 'Trạng thái thanh toán không được để trống'));
      }

      const updated = await paymentService.updatePaymentStatus(
        parseInt(orderId),
        payment_status,
        transaction_id
      );

      if (!updated) {
        return next(new ApiError(404, 'Không tìm thấy thông tin thanh toán'));
      }

      return res.json(JSend.success({ message: 'Cập nhật trạng thái thanh toán thành công' }));
    } catch (error) {
      console.error('Error updating payment status:', error);
      return next(new ApiError(500, error.message || 'Lỗi khi cập nhật trạng thái thanh toán'));
    }
  }

  async getPaymentInfo(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return next(new ApiError(404, 'Không tìm thấy đơn hàng'));
      }

      if (order.user_id !== userId) {
        return next(new ApiError(403, 'Bạn chỉ có thể xem thông tin thanh toán của đơn hàng mình'));
      }

      const payment = await paymentService.getPaymentByOrderId(parseInt(orderId));
      if (!payment) {
        return next(new ApiError(404, 'Không tìm thấy thông tin thanh toán'));
      }

      return res.json(JSend.success({ payment }));
    } catch (error) {
      console.error('Error getting payment info:', error);
      return next(new ApiError(500, 'Lỗi khi lấy thông tin thanh toán'));
    }
  }
}

module.exports = new PaymentController();