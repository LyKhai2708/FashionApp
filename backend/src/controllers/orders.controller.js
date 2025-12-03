const orderService = require('../services/order.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');
const { getUserPermissions } = require('../helpers/permission.helper');

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

      const isOwner = order.user_id === req.user.id;
      const userPermissions = await getUserPermissions(req.user.id);
      const hasPermission = userPermissions.includes('orders.view');

      if (!isOwner && !hasPermission) {
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

      const isOwner = order.user_id === req.user.id;
      const userPermissions = await getUserPermissions(req.user.id);
      const hasPermission = userPermissions.includes('orders.cancel');

      if (!isOwner && !hasPermission) {
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
  //khuc nay chua chac , se sua sau
  async updateOrderAddress(req, res, next) {
    try {
      const { id } = req.params;
      const addressData = req.body;
      const userId = req.user.id;

      const requiredFields = [
        'receiver_name',
        'receiver_phone',
        'receiver_email',
        'shipping_province',
        'shipping_province_code',
        'shipping_ward',
        'shipping_ward_code',
        'shipping_detail_address'
      ];

      for (const field of requiredFields) {
        if (!addressData[field]) {
          return next(new ApiError(400, `${field} không được để trống`));
        }
      }

      if (!/^(0)[0-9]{9,10}$/.test(addressData.receiver_phone)) {
        return next(new ApiError(400, 'Số điện thoại không hợp lệ'));
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(addressData.receiver_email)) {
        return next(new ApiError(400, 'Email không hợp lệ'));
      }

      const updatedOrder = await orderService.updateOrderAddress(id, userId, addressData);

      return res.json(JSend.success({
        order: updatedOrder,
        message: 'Cập nhật địa chỉ đơn hàng thành công'
      }));
    } catch (error) {
      console.error('Error updating order address:', error);
      return next(new ApiError(500, error.message || 'Lỗi khi cập nhật địa chỉ đơn hàng'));
    }
  }

}

module.exports = new OrdersController();
