const promotionController = require('../controllers/promotions.controller');
const express = require('express');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

/**
 * @swagger
 * tags:
 *   name: Promotions
 *   description: Promotion management endpoints
 */

module.exports.setup = (app) => {
    app.use('/api/v1/promotions', router);

    /**
     * @swagger
     * /api/v1/promotions:
     *   get:
     *     summary: Get promotions with filters
     *     description: Retrieve promotions with pagination and filtering options
     *     tags: [Promotions]
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Items per page
     *       - in: query
     *         name: active
     *         schema:
     *           type: boolean
     *         description: Filter by active status
     *       - in: query
     *         name: promo_name
     *         schema:
     *           type: string
     *         description: Search by promotion name
     *     responses:
     *       200:
     *         description: Promotions retrieved successfully
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
     *                     promotions:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Promotion'
     *                     metadata:
     *                       $ref: '#/components/schemas/PaginationMetadata'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.get('/', promotionController.getPromotionsbyFilter);

    /**
     * @swagger
     * /api/v1/promotions:
     *   post:
     *     summary: Create a new promotion
     *     description: Create a new promotion. Admin only.
     *     tags: [Promotions]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreatePromotionRequest'
     *           example:
     *             name: "Summer Sale 2024"
     *             description: "Big summer discount on all items"
     *             discount_percent: 25
     *             start_date: "2024-06-01"
     *             end_date: "2024-08-31"
     *             active: true
     *     responses:
     *       201:
     *         description: Promotion created successfully
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
     *                     promotion:
     *                       $ref: '#/components/schemas/Promotion'
     *       400:
     *         description: Bad request - Invalid input data
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.post('/', authMiddleware, checkPermission, promotionController.createPromotion);
    /**
     * @swagger
     * /api/v1/promotions/{promo_id}/product/{product_id}:
     *   post:
     *     summary: Add product to promotion
     *     description: Add a product to an existing promotion. Admin only.
     *     tags: [Promotions]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: promo_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Promotion ID
     *       - in: path
     *         name: product_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Product ID
     *     responses:
     *       200:
     *         description: Product added to promotion successfully
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
     *                     result:
     *                       type: object
     *                       description: Operation result
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Promotion or product not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.post('/:promo_id/product/:product_id', authMiddleware, checkPermission, promotionController.addProductToPromotion);
    /**
     * @swagger
     * /api/v1/promotions/{promo_id}/product/{product_id}:
     *   delete:
     *     summary: Remove product from promotion
     *     description: Remove a product from an existing promotion. Admin only.
     *     tags: [Promotions]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: promo_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Promotion ID
     *       - in: path
     *         name: product_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Product ID
     *     responses:
     *       200:
     *         description: Product removed from promotion successfully
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
     *                     result:
     *                       type: object
     *                       description: Operation result
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Promotion or product not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.delete('/:promo_id/product/:product_id', authMiddleware, checkPermission, promotionController.removeProductFromPromotion);
    /**
     * @swagger
     * /api/v1/promotions/{promo_id}/products:
     *   get:
     *     summary: Get products in promotion
     *     description: Retrieve all products that are part of a specific promotion
     *     tags: [Promotions]
     *     parameters:
     *       - in: path
     *         name: promo_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Promotion ID
     *       - $ref: '#/components/parameters/limitParam'
     *       - $ref: '#/components/parameters/pageParam'
     *     responses:
     *       200:
     *         description: Products in promotion retrieved successfully
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
     *                     result:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Product'
     *       404:
     *         description: Promotion not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.get('/:promo_id/products', promotionController.getProductsInPromotion);

    /**
     * @swagger
     * /api/v1/promotions/{promo_id}:
     *   get:
     *     summary: Get promotion by ID
     *     description: Retrieve a single promotion by its ID
     *     tags: [Promotions]
     *     parameters:
     *       - in: path
     *         name: promo_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Promotion ID
     *     responses:
     *       200:
     *         description: Promotion retrieved successfully
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
     *                     promotion:
     *                       $ref: '#/components/schemas/Promotion'
     *       404:
     *         description: Promotion not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.get('/:promo_id', promotionController.getPromotionById);

    /**
     * @swagger
     * /api/v1/promotions/{promo_id}:
     *   delete:
     *     summary: Deactivate promotion
     *     description: Deactivate a promotion (set active = false). Admin only.
     *     tags: [Promotions]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: promo_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Promotion ID
     *     responses:
     *       200:
     *         description: Promotion deactivated successfully
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
     *                     result:
     *                       type: object
     *                       description: Operation result
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Promotion not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.delete('/:promo_id', authMiddleware, checkPermission, promotionController.deactivatePromotion);
    router.all('/', methodNotAllowed);
    router.all('/:promo_id', methodNotAllowed);
    router.all('/:promo_id/product/:product_id', methodNotAllowed);
}