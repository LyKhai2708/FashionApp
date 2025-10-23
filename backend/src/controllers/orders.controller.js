const orderService = require('../services/order.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

class OrdersController {
  async createOrder(req, res, next) {
    try {
      const { items, ...orderData } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, 'Danh sách sản phẩm không được để trống');
      }

      // Gán user_id từ thông tin xác thực
      orderData.user_id = req.user.id;

      const order = await orderService.createOrder(orderData, items);
      
      return res.status(201).json(JSend.success({ order }));
    } catch (error) {
      console.error('Error creating order:', error);
      return next(new ApiError(500, error.message || 'Lỗi khi tạo đơn hàng'));
    }
  }

  async getMyOrders(req, res, next) {
    try {
      const { 
        user_id,
        order_status, 
        payment_status, 
        payment_method,
        start_date,
        end_date,
        page = 1, 
        limit = 10 
      } = req.query;

      const filters = { ...req.query };
      filters.user_id = req.user.id;

      const result = await orderService.getOrders(
        filters,
        parseInt(page, 10),
        parseInt(limit, 10)
      );

      return res.json(JSend.success({ orders: result.data, pagination: result.pagination }));
    } catch (error) {
      console.error('Error getting orders:', error);
      return next(new ApiError(500, 'Lỗi khi lấy danh sách đơn hàng'));
    }
  }

  async getOrders(req, res, next) {
    try {
      const { 
        order_status,
        payment_status,
        payment_method,
        start_date, 
        end_date, 
        page = 1, 
        limit = 10 
      } = req.query;

      const filters = {
        order_status,
        payment_status,
        payment_method,
        start_date,
        end_date
      };

      const result = await orderService.getOrders(
        filters,
        parseInt(page, 10),
        parseInt(limit, 10)
      );

      return res.json(JSend.success({
        orders: result.data,
        pagination: result.pagination
      }));
    } catch (error) {
      console.error('Error getting orders:', error);
      return next(new ApiError(500, 'Lỗi khi lấy danh sách đơn hàng'));
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);

      if (!order) {
        return next(new ApiError(404, 'Không tìm thấy đơn hàng'));
      }


      if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
        return next(new ApiError(403, 'Không có quyền truy cập đơn hàng này'));
      }

      return res.json(JSend.success({ order }));
    } catch (error) {
      console.error('Error getting order:', error);
      return next(new ApiError(500, 'Lỗi khi lấy thông tin đơn hàng'));
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        return next(new ApiError(403, 'Chỉ admin mới có quyền thực hiện thao tác này'));
      }

      const { id } = req.params;
      const { order_status } = req.body;

      if (!order_status) {
        throw new ApiError(400, 'Trạng thái đơn hàng không được để trống');
      }

      const adminId = req.user?.user_id || null;
      const updated = await orderService.updateOrderStatus(id, order_status, adminId);
      
      if (!updated) {
        return next(new ApiError(404, 'Không tìm thấy đơn hàng'));
      }

      return res.json(JSend.success({ message: 'Cập nhật trạng thái đơn hàng thành công' }));
    } catch (error) {
      console.error('Error updating order status:', error);
      return next(new ApiError(500, error.message || 'Lỗi khi cập nhật trạng thái đơn hàng'));
    }
  }


  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { cancel_reason } = req.body;

      if (!cancel_reason || !String(cancel_reason).trim()) {
        return next(new ApiError(400, 'Vui lòng nhập lý do hủy đơn hàng'));
      }

      const order = await orderService.getOrderById(id);
      
      if (!order) {
        return next(new ApiError(404, 'Không tìm thấy đơn hàng'));
      }

      if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
        return next(new ApiError(403, 'Bạn không có quyền hủy đơn hàng này'));
      }

      await orderService.cancelOrder(Number(id), cancel_reason);

      return res.json(JSend.success({ message: 'Hủy đơn hàng thành công' }));
    } catch (error) {
      console.error('Error cancelling order:', error);
      return next(new ApiError(500, 'Lỗi khi hủy đơn hàng'));
    }
  }
  async getEligibleOrdersForReview(req, res, next) {
    try {
      const { productId } = req.params;
      const userId = req.user.id;
  
      if (!productId || isNaN(productId)) {
        return next(new ApiError(400, "Product ID không hợp lệ"));
      }
  
      const orders = await orderService.getEligibleOrdersForReview(userId, parseInt(productId));
      return res.json(JSend.success({ orders }));
    } catch (err) {
      console.error('Error getting eligible orders:', err);
      return next(new ApiError(500, "Lỗi khi lấy danh sách đơn hàng hợp lệ"));
    }
  }

  async updatePaymentStatus(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        return next(new ApiError(403, 'Chỉ admin mới có quyền thực hiện thao tác này'));
      }

      const { id } = req.params;
      const { payment_status } = req.body;

      if (!payment_status) {
        throw new ApiError(400, 'Trạng thái thanh toán không được để trống');
      }

      const validStatuses = ['pending', 'paid', 'failed', 'cancelled', 'refunded'];
      if (!validStatuses.includes(payment_status)) {
        throw new ApiError(400, 'Trạng thái thanh toán không hợp lệ');
      }

      const updated = await orderService.updatePaymentStatus(id, payment_status);
      
      if (!updated) {
        return next(new ApiError(404, 'Không tìm thấy thông tin thanh toán'));
      }

      return res.json(JSend.success({ message: 'Cập nhật trạng thái thanh toán thành công' }));
    } catch (error) {
      console.error('Error updating payment status:', error);
      return next(new ApiError(500, error.message || 'Lỗi khi cập nhật trạng thái thanh toán'));
    }
  }
  
}

module.exports = new OrdersController();
