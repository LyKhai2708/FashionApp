const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/cart', router);
    
    router.use(authMiddleware);
    
    /**
     * @swagger
     * /api/v1/cart:
     *   get:
     *     summary: Get user's shopping cart
     *     description: Retrieve all items in the authenticated user's shopping cart with product details, pricing, and promotions
     *     tags:
     *       - cart
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Cart retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [success]
     *                 data:
     *                   type: object
     *                   properties:
     *                     cart:
     *                       type: object
     *                       properties:
     *                         items:
     *                           type: array
     *                           items:
     *                             type: object
     *                             properties:
     *                               cart_id:
     *                                 type: integer
     *                                 description: Cart item ID
     *                                 example: 1
     *                               quantity:
     *                                 type: integer
     *                                 description: Quantity of the item
     *                                 example: 2
     *                               added_at:
     *                                 type: string
     *                                 format: date-time
     *                                 description: When item was added to cart
     *                               variant:
     *                                 type: object
     *                                 properties:
     *                                   variant_id:
     *                                     type: integer
     *                                     example: 123
     *                                   stock_quantity:
     *                                     type: integer
     *                                     example: 50
     *                                   color:
     *                                     type: object
     *                                     properties:
     *                                       color_id:
     *                                         type: integer
     *                                         example: 1
     *                                       name:
     *                                         type: string
     *                                         example: "Đen"
     *                                       hex_code:
     *                                         type: string
     *                                         example: "#000000"
     *                                   size:
     *                                     type: object
     *                                     properties:
     *                                       size_id:
     *                                         type: integer
     *                                         example: 2
     *                                       name:
     *                                         type: string
     *                                         example: "M"
     *                               product:
     *                                 type: object
     *                                 properties:
     *                                   product_id:
     *                                     type: integer
     *                                     example: 456
     *                                   name:
     *                                     type: string
     *                                     example: "Áo khoác bomber"
     *                                   base_price:
     *                                     type: number
     *                                     format: float
     *                                     example: 599000
     *                                   thumbnail:
     *                                     type: string
     *                                     example: "/public/uploads/bomber-thumb.jpg"
     *                                   image_url:
     *                                     type: string
     *                                     example: "/public/uploads/bomber-black.jpg"
     *                                   discount_percent:
     *                                     type: number
     *                                     format: float
     *                                     example: 20
     *                                   unit_price:
     *                                     type: number
     *                                     format: float
     *                                     description: Final price after discount
     *                                     example: 479200
     *                               subtotal:
     *                                 type: number
     *                                 format: float
     *                                 description: Total price for this item (unit_price * quantity)
     *                                 example: 958400
     *                         summary:
     *                           type: object
     *                           properties:
     *                             total_items:
     *                               type: integer
     *                               description: Number of different products in cart
     *                               example: 3
     *                             total_quantity:
     *                               type: integer
     *                               description: Total quantity of all items
     *                               example: 5
     *                             total_amount:
     *                               type: number
     *                               format: float
     *                               description: Total cart value
     *                               example: 1500000
     *       401:
     *         description: Unauthorized - No valid token provided
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
     *                   example: "Unauthorized"
     *       403:
     *         description: Forbidden - Invalid token
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
     *                   example: "Invalid token"
     *       500:
     *         description: Server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   enum: [error]
     *                 message:
     *                   type: string
     *                   example: "Lỗi khi lấy giỏ hàng"
     */
    router.get('/', cartController.getCart);
    
    /**
     * @swagger
     * /api/v1/cart:
     *   post:
     *     summary: Add item to cart
     *     description: Add a product variant to the user's shopping cart
     *     tags:
     *       - cart
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - product_variant_id
     *             properties:
     *               product_variant_id:
     *                 type: integer
     *                 description: ID of the product variant to add
     *                 example: 123
     *               quantity:
     *                 type: integer
     *                 description: Quantity to add (default is 1)
     *                 minimum: 1
     *                 example: 2
     *     responses:
     *       200:
     *         description: Item added to cart successfully
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
     *                     cart:
     *                       $ref: '#/components/schemas/Cart'
     *                     message:
     *                       type: string
     *                       example: "Đã thêm sản phẩm vào giỏ hàng"
     *       400:
     *         description: Bad request - Invalid input or insufficient stock
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
     *                   example: "Sản phẩm không đủ số lượng"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.post('/', cartController.addToCart);
    
    /**
     * @swagger
     * /api/v1/cart:
     *   delete:
     *     summary: Clear entire cart
     *     description: Remove all items from the user's shopping cart
     *     tags:
     *       - cart
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Cart cleared successfully
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
     *                       example: "Đã xóa tất cả sản phẩm khỏi giỏ hàng"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.delete('/', cartController.clearCart);
    router.all('/', methodNotAllowed);
    
    /**
     * @swagger
     * /api/v1/cart/quantity:
     *   get:
     *     summary: Get cart item count
     *     description: Get the total quantity of items in the user's cart
     *     tags:
     *       - cart
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Cart item count retrieved successfully
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
     *                     count:
     *                       type: integer
     *                       description: Total quantity of all items in cart
     *                       example: 5
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.get('/quantity', cartController.getCartItemCount);
    router.all('/quantity', methodNotAllowed);
    
    /**
     * @swagger
     * /api/v1/cart/bulk-add:
     *   put:
     *     summary: Merge local cart to server
     *     description: Merge guest cart items to authenticated user's cart
     *     tags:
     *       - cart
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
     *             properties:
     *               items:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     product_variants_id:
     *                       type: integer
     *                     quantity:
     *                       type: integer
     *     responses:
     *       200:
     *         description: Cart merged successfully
     */
    router.put('/bulk-add', cartController.mergeLocalCartToCart);
    router.all('/bulk-add', methodNotAllowed);
    
    /**
     * @swagger
     * /api/v1/cart/{cartId}:
     *   put:
     *     summary: Update cart item quantity
     *     description: Update the quantity of a specific item in the cart
     *     tags:
     *       - cart
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: cartId
     *         in: path
     *         required: true
     *         description: ID of the cart item to update
     *         schema:
     *           type: integer
     *           example: 1
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - quantity
     *             properties:
     *               quantity:
     *                 type: integer
     *                 description: New quantity for the cart item
     *                 minimum: 1
     *                 example: 3
     *     responses:
     *       200:
     *         description: Cart item updated successfully
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
     *                     cart:
     *                       $ref: '#/components/schemas/Cart'
     *                     message:
     *                       type: string
     *                       example: "Đã cập nhật số lượng sản phẩm"
     *       400:
     *         description: Bad request - Invalid quantity or insufficient stock
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
     *                   example: "Không tìm thấy sản phẩm trong giỏ hàng"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.put('/:cartId', cartController.updateCartItem);
    
    /**
     * @swagger
     * /api/v1/cart/{cartId}:
     *   delete:
     *     summary: Remove item from cart
     *     description: Remove a specific item from the user's shopping cart
     *     tags:
     *       - cart
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: cartId
     *         in: path
     *         required: true
     *         description: ID of the cart item to remove
     *         schema:
     *           type: integer
     *           example: 1
     *     responses:
     *       200:
     *         description: Item removed from cart successfully
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
     *                     cart:
     *                       $ref: '#/components/schemas/Cart'
     *                     message:
     *                       type: string
     *                       example: "Đã xóa sản phẩm khỏi giỏ hàng"
     *       400:
     *         description: Bad request - Cart item not found
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
     *                   example: "Không tìm thấy sản phẩm trong giỏ hàng"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.delete('/:cartId', cartController.removeFromCart);
    router.all('/:cartId', methodNotAllowed);
};
