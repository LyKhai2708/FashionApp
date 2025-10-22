const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');
const {authMiddleware, authorizeRoles} = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');



module.exports.setup = (app) => {
  
  app.use('/api/v1/orders', authMiddleware, router);

  router.get('/product/:productId/reviews', ordersController.getEligibleOrdersForReview);
  router.get('/me', ordersController.getMyOrders);
  /**
   * @swagger
   * /api/v1/orders:
   *   post:
   *     summary: Create a new order
   *     description: Create a new order with items. User ID is automatically set from authentication token.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - items
   *               - shipping_address
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - product_variant_id
   *                     - quantity
   *                     - price
   *                   properties:
   *                     product_variant_id:
   *                       type: integer
   *                       description: ID of the product variant
   *                     quantity:
   *                       type: integer
   *                       minimum: 1
   *                       description: Quantity to order
   *                     price:
   *                       type: number
   *                       minimum: 0
   *                       description: Price per unit
   *               shipping_fee:
   *                 type: number
   *                 minimum: 0
   *                 default: 0
   *                 description: Shipping fee
   *               payment_method:
   *                 type: string
   *                 enum: [cash_on_delivery, bank_transfer]
   *                 default: cash_on_delivery
   *                 description: Payment method
   *               notes:
   *                 type: string
   *                 description: Order notes
   *               shipping_address:
   *                 type: string
   *                 description: Delivery address
   *           example:
   *             items:
   *               - product_variant_id: 1
   *                 quantity: 2
   *                 price: 299000
   *               - product_variant_id: 3
   *                 quantity: 1
   *                 price: 450000
   *             shipping_fee: 30000
   *             payment_method: "cash_on_delivery"
   *             notes: "Giao hàng giờ hành chính"
   *             shipping_address: "123 Nguyen Van A, District 1, Ho Chi Minh City"
   *     responses:
   *       201:
   *         description: Order created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [success]
   *                 data:
   *                   type: object
   *                   properties:
   *                     order:
   *                       type: object
   *                       properties:
   *                         order_id:
   *                           type: integer
   *                         user_id:
   *                           type: integer
   *                         order_status:
   *                           type: string
   *                           enum: [pending]
   *                         sub_total:
   *                           type: number
   *                         shipping_fee:
   *                           type: number
   *                         total_amount:
   *                           type: number
   *                         payment_method:
   *                           type: string
   *                           enum: [cash_on_delivery, bank_transfer]
   *                         payment_status:
   *                           type: string
   *                           enum: [unpaid]
   *                         notes:
   *                           type: string
   *                         shipping_address:
   *                           type: string
   *             example:
   *               status: success
   *               data:
   *                 order:
   *                   order_id: 123
   *                   user_id: 1
   *                   order_status: pending
   *                   sub_total: 1048000
   *                   shipping_fee: 30000
   *                   total_amount: 1078000
   *                   payment_method: cash_on_delivery
   *                   payment_status: unpaid
   *                   notes: "Giao hàng giờ hành chính"
   *                   shipping_address: "123 Nguyen Van A, District 1, Ho Chi Minh City"
   *       400:
   *         description: Bad request - Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [fail]
   *                 message:
   *                   type: string
   *             example:
   *               status: fail
   *               message: "Danh sách sản phẩm không được để trống"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.post('/',authMiddleware, ordersController.createOrder);
  
  /**
   * @swagger
   * /api/v1/orders:
   *   get:
   *     summary: Get list of orders
   *     description: Get paginated list of orders. Regular users see only their orders, admins see all orders.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: order_status
   *         schema:
   *           type: string
   *           enum: [pending, processing, shipped, delivered, cancelled]
   *         description: Filter by order status
   *       - in: query
   *         name: payment_status
   *         schema:
   *           type: string
   *           enum: [unpaid, paid, refund]
   *         description: Filter by payment status
   *       - in: query
   *         name: payment_method
   *         schema:
   *           type: string
   *           enum: [cash_on_delivery, bank_transfer]
   *         description: Filter by payment method
   *       - in: query
   *         name: start_date
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter orders from this date
   *       - in: query
   *         name: end_date
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter orders to this date
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: List of orders retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OrderListResponse'
   *             example:
   *               status: success
   *               data:
   *                 data:
   *                   - order_id: 123
   *                     user_id: 1
   *                     order_status: pending
   *                     sub_total: 1048000
   *                     shipping_fee: 30000
   *                     total_amount: 1078000
   *                     payment_method: cash_on_delivery
   *                     payment_status: unpaid
   *                     notes: "Giao hàng giờ hành chính"
   *                     shipping_address: "123 Nguyen Van A, District 1, Ho Chi Minh City"
   *                     order_date: "2024-01-15T10:30:00Z"
   *                     customer_name: "Nguyen Van A"
   *                     customer_email: "nguyenvana@email.com"
   *                   - order_id: 124
   *                     user_id: 1
   *                     order_status: delivered
   *                     sub_total: 720000
   *                     shipping_fee: 30000
   *                     total_amount: 750000
   *                     payment_method: bank_transfer
   *                     payment_status: paid
   *                     notes: null
   *                     shipping_address: "456 Le Thi B, District 3, Ho Chi Minh City"
   *                     order_date: "2024-01-10T14:20:00Z"
   *                     customer_name: "Nguyen Van A"
   *                     customer_email: "nguyenvana@email.com"
   *                 pagination:
   *                   total: 25
   *                   total_pages: 3
   *                   current_page: 1
   *                   per_page: 10
   *                   has_next_page: true
   *                   has_previous_page: false
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get('/', authMiddleware, ordersController.getOrders);
  
  /**
   * @swagger
   * /api/v1/orders/{id}:
   *   get:
   *     summary: Get order details by ID
   *     description: Get detailed information about a specific order including items. Users can only access their own orders, admins can access any order.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/orderIdParam'
   *     responses:
   *       200:
   *         description: Order details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OrderDetailResponse'
   *             example:
   *               status: success
   *               data:
   *                 order:
   *                   order_id: 123
   *                   user_id: 1
   *                   order_status: pending
   *                   sub_total: 1048000
   *                   shipping_fee: 30000
   *                   total_amount: 1078000
   *                   payment_method: cash_on_delivery
   *                   payment_status: unpaid
   *                   notes: "Giao hàng giờ hành chính"
   *                   shipping_address: "123 Nguyen Van A, District 1, Ho Chi Minh City"
   *                   order_date: "2024-01-15T10:30:00Z"
   *                   customer_name: "Nguyen Van A"
   *                   customer_email: "nguyenvana@email.com"
   *                   customer_phone: "0901234567"
   *                   items:
   *                     - order_detail_id: 1
   *                       product_variant_id: 1
   *                       quantity: 2
   *                       price: 299000
   *                       discount_amount: 0
   *                       sub_total: 598000
   *                       product_name: "Áo thun nam basic"
   *                       size_name: "L"
   *                       color_name: "Đen"
   *                       color_code: "#000000"
   *                       image_url: "https://example.com/image1.jpg"
   *                     - order_detail_id: 2
   *                       product_variant_id: 3
   *                       quantity: 1
   *                       price: 450000
   *                       discount_amount: 0
   *                       sub_total: 450000
   *                       product_name: "Quần jeans slim fit"
   *                       size_name: "32"
   *                       color_name: "Xanh đậm"
   *                       color_code: "#1e3a8a"
   *                       image_url: "https://example.com/image2.jpg"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         description: Order not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [fail]
   *                 message:
   *                   type: string
   *             example:
   *               status: fail
   *               message: "Không tìm thấy đơn hàng"
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get('/:id', authMiddleware, ordersController.getOrderById);
  
  /**
   * @swagger
   * /api/v1/orders/{id}/status:
   *   patch:
   *     summary: Update order status (Admin only)
   *     description: Update the status of an order. Only administrators can perform this action.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/orderIdParam'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - order_status
   *             properties:
   *               order_status:
   *                 type: string
   *                 enum: [pending, processing, shipped, delivered, cancelled]
   *                 description: New order status
   *           example:
   *             order_status: processing
   *     responses:
   *       200:
   *         description: Order status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [success]
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *             example:
   *               status: success
   *               data:
   *                 message: "Cập nhật trạng thái đơn hàng thành công"
   *       400:
   *         description: Bad request - Invalid status or missing data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [fail]
   *                 message:
   *                   type: string
   *             example:
   *               status: fail
   *               message: "Trạng thái không được để trống"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         description: Forbidden - Admin access required
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [fail]
   *                 message:
   *                   type: string
   *             example:
   *               status: fail
   *               message: "Chỉ admin mới có quyền thực hiện thao tác này"
   *       404:
   *         description: Order not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [fail]
   *                 message:
   *                   type: string
   *             example:
   *               status: fail
   *               message: "Không tìm thấy đơn hàng"
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.patch('/:id/status', authMiddleware, authorizeRoles(['admin']), ordersController.updateOrderStatus);
  
  /**
   * @swagger
   * /api/v1/orders/{id}:
   *   delete:
   *     summary: Cancel an order
   *     description: Cancel an order. Users can cancel their own pending orders, admins can cancel any pending order.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/orderIdParam'
   *     responses:
   *       200:
   *         description: Order cancelled successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [success]
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *             example:
   *               status: success
   *               data:
   *                 message: "Hủy đơn hàng thành công"
   *       400:
   *         description: Bad request - Order cannot be cancelled
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [fail]
   *                 message:
   *                   type: string
   *             example:
   *               status: fail
   *               message: "Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xử lý"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         description: Forbidden - No permission to cancel this order
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [fail]
   *                 message:
   *                   type: string
   *             example:
   *               status: fail
   *               message: "Bạn không có quyền hủy đơn hàng này"
   *       404:
   *         description: Order not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [fail]
   *                 message:
   *                   type: string
   *             example:
   *               status: fail
   *               message: "Không tìm thấy đơn hàng"
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.delete('/:id/cancel', authMiddleware, ordersController.cancelOrder);
  router.all('/', methodNotAllowed);
  router.all('/:id', methodNotAllowed);
  router.all('/:id/status', methodNotAllowed);
};
