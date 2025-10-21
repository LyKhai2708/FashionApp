const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');
const paymentsController = require('../controllers/payments.controller');

module.exports.setup = (app) => {
  app.use('/api/v1/payments', authMiddleware, router);

  /**
   * @swagger
   * /api/v1/payments/create:
   *   post:
   *     summary: Tạo payment link cho đơn hàng
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - orderId
   *             properties:
   *               orderId:
   *                 type: integer
   *                 description: ID của đơn hàng
   *               returnUrl:
   *                 type: string
   *                 description: URL redirect khi thanh toán thành công
   *               cancelUrl:
   *                 type: string
   *                 description: URL redirect khi hủy thanh toán
   *     responses:
   *       200:
   *         description: Tạo payment link thành công
   *       400:
   *         description: Dữ liệu đầu vào không hợp lệ
   *       403:
   *         description: Không có quyền truy cập
   *       404:
   *         description: Không tìm thấy đơn hàng
   */
  router.post('/create', paymentsController.createPaymentLink);

  /**
   * @swagger
   * /api/v1/payments/check/{orderId}:
   *   get:
   *     summary: Kiểm tra trạng thái thanh toán
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của đơn hàng
   *     responses:
   *       200:
   *         description: Thông tin trạng thái thanh toán
   *       403:
   *         description: Không có quyền truy cập
   *       404:
   *         description: Không tìm thấy đơn hàng
   */
  router.get('/check/:orderId', paymentsController.checkPaymentStatus);

  /**
   * @swagger
   * /api/v1/payments/cancel/{orderId}:
   *   delete:
   *     summary: Hủy thanh toán
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của đơn hàng
   *     responses:
   *       200:
   *         description: Hủy thanh toán thành công
   *       403:
   *         description: Không có quyền truy cập
   *       404:
   *         description: Không tìm thấy đơn hàng
   */
  router.delete('/cancel/:orderId', paymentsController.cancelPayment);

  /**
   * @swagger
   * /api/v1/payments/info/{orderId}:
   *   get:
   *     summary: Lấy thông tin thanh toán của đơn hàng
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của đơn hàng
   *     responses:
   *       200:
   *         description: Thông tin thanh toán
   *       403:
   *         description: Không có quyền truy cập
   *       404:
   *         description: Không tìm thấy thông tin thanh toán
   */
  router.get('/info/:orderId', paymentsController.getPaymentInfo);

  /**
   * @swagger
   * /api/v1/payments/admin/update-status/{orderId}:
   *   patch:
   *     summary: Cập nhật trạng thái thanh toán (Admin only)
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của đơn hàng
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - payment_status
   *             properties:
   *               payment_status:
   *                 type: string
   *                 enum: [pending, paid, failed, cancelled, refunded]
   *                 description: Trạng thái thanh toán mới
   *               transaction_id:
   *                 type: string
   *                 description: ID giao dịch (nếu có)
   *     responses:
   *       200:
   *         description: Cập nhật trạng thái thành công
   *       400:
   *         description: Dữ liệu đầu vào không hợp lệ
   *       403:
   *         description: Không có quyền admin
   *       404:
   *         description: Không tìm thấy thông tin thanh toán
   */
  router.patch('/admin/status/:orderId', 
    authorizeRoles(['admin']), 
    paymentsController.updatePaymentStatus
  );

  router.all('*', methodNotAllowed);
};