const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product review management endpoints
 */

module.exports.setup = (app) => {
  // Nested routes for product reviews
  app.use('/api/v1/products/:productId/reviews', authMiddleware, router);
  
  // Direct routes for review management
  const reviewRouter = express.Router();
  app.use('/api/v1/reviews', authMiddleware, reviewRouter);

  /**
   * @swagger
   * /api/v1/products/{productId}/reviews:
   *   get:
   *     summary: Get product reviews
   *     description: Get paginated list of reviews for a specific product
   *     tags: [Reviews]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Product ID
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
   *           maximum: 50
   *           default: 5
   *         description: Number of reviews per page
   *     responses:
   *       200:
   *         description: Reviews retrieved successfully
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
   *                     reviews:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Review'
   *                     metadata:
   *                       $ref: '#/components/schemas/PaginationMetadata'
   *                     average_rating:
   *                       type: number
   *                       format: float
   *                       description: Average rating for the product
   *                     total_reviews:
   *                       type: integer
   *                       description: Total number of reviews
   *             example:
   *               status: success
   *               data:
   *                 reviews:
   *                   - id: 1
   *                     user_id: 123
   *                     product_id: 456
   *                     order_id: 789
   *                     rating: 5
   *                     comment: "Sản phẩm rất tốt, chất lượng cao"
   *                     created_at: "2024-01-15T10:30:00Z"
   *                     customer_name: "Nguyen Van A"
   *                     customer_email: "nguyenvana@email.com"
   *                 metadata:
   *                   totalRecords: 25
   *                   firstPage: 1
   *                   lastPage: 5
   *                   page: 1
   *                   limit: 5
   *                 average_rating: 4.2
   *                 total_reviews: 25
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         description: Product not found
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get('/', reviewController.getProductReview);

  /**
   * @swagger
   * /api/v1/products/{productId}/reviews:
   *   post:
   *     summary: Create a product review
   *     description: Create a new review for a product. User must have purchased the product.
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Product ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateReviewRequest'
   *           example:
   *             order_id: 789
   *             rating: 5
   *             comment: "Sản phẩm rất tốt, chất lượng cao, giao hàng nhanh"
   *     responses:
   *       201:
   *         description: Review created successfully
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
   *                     review:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: integer
   *             example:
   *               status: success
   *               data:
   *                 review:
   *                   id: 123
   *       400:
   *         description: Bad request - Invalid input or user hasn't purchased product
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
   *             examples:
   *               not_purchased:
   *                 summary: User hasn't purchased the product
   *                 value:
   *                   status: fail
   *                   message: "Bạn chưa mua sản phẩm này không thể đánh giá"
   *               already_reviewed:
   *                 summary: User already reviewed this product
   *                 value:
   *                   status: fail
   *                   message: "Bạn đã đánh giá sản phẩm này rồi"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.post('/', reviewController.createReview);

  /**
   * @swagger
   * /api/v1/reviews/{id}:
   *   put:
   *     summary: Update a review
   *     description: Update user's own review. Users can only update their own reviews.
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Review ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateReviewRequest'
   *           example:
   *             rating: 4
   *             comment: "Sản phẩm tốt nhưng giao hàng hơi chậm"
   *     responses:
   *       200:
   *         description: Review updated successfully
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
   *                     review:
   *                       type: integer
   *                       description: Number of affected rows
   *             example:
   *               status: success
   *               data:
   *                 review: 1
   *       400:
   *         description: Bad request - Invalid input
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         description: Forbidden - Cannot update other user's review
   *       404:
   *         description: Review not found
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */

  // Direct review management routes
  reviewRouter.put('/:id', reviewController.updateReview);
  
  /**
   * @swagger
   * /api/v1/reviews/{id}:
   *   delete:
   *     summary: Delete a review
   *     description: Delete a review. Users can delete their own reviews, admins can delete any review.
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Review ID
   *     responses:
   *       200:
   *         description: Review deleted successfully
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
   *                     review:
   *                       type: integer
   *                       description: Number of affected rows
   *             example:
   *               status: success
   *               data:
   *                 review: 1
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         description: Forbidden - Cannot delete other user's review (unless admin)
   *       404:
   *         description: Review not found
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  reviewRouter.delete('/:id', reviewController.deleteReview);

  // Method not allowed handlers
  router.all('/', methodNotAllowed);
  router.all('/:id', methodNotAllowed);
  reviewRouter.all('/:id', methodNotAllowed);
};
