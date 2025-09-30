const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');
const {authMiddleware, authorizeRoles} = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');

/**
 * Cấu hình router cho quản lý đơn hàng
 * @param {Object} app - Ứng dụng Express
 */
module.exports.setup = (app) => {
  // Sử dụng middleware xác thực cho tất cả các route
  // app.use('/orders', authenticate, router);
  app.use('/api/v1/orders', authMiddleware, router);
  router.post('/',authMiddleware, ordersController.createOrder);
  
  // danh sách đơn
  router.get('/', authMiddleware, ordersController.getOrders);
  
  //chi tiết
  router.get('/:id', authMiddleware, ordersController.getOrderById);
  
  // cập nhật trạng thái đơn hàng (chỉ admin)
  router.patch('/:id/status', authMiddleware, authorizeRoles(['admin']), ordersController.updateOrderStatus);
  
  // Hủy đơn hàng
  router.delete('/:id', authMiddleware, ordersController.cancelOrder);
  router.all('/', methodNotAllowed);
  router.all('/:id', methodNotAllowed);
  router.all('/:id/status', methodNotAllowed);
};
