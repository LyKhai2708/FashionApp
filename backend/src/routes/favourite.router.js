const express = require('express');
const router = express.Router();
const favouriteController = require('../controllers/favourite.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/favorites', router);
    
    // Tất cả routes cần authentication
    router.use(authMiddleware);
    
    /**
     * @swagger
     * /api/v1/favorites:
     *   get:
     *     summary: Get user favorites
     *     description: Get list of user's favorite products with detailed information including promotions, colors, and pricing
     *     tags:
     *       - favorites
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/limitParam'
     *       - $ref: '#/components/parameters/pageParam'
     *     responses:
     *       200:
     *         description: List of user's favorite products with detailed information
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
     *                     metadata:
     *                       $ref: '#/components/schemas/PaginationMetadata'
     *                     favorites:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           favorite_id:
     *                             type: integer
     *                             description: Favorite record ID
     *                             example: 1
     *                           product_id:
     *                             type: integer
     *                             description: Product ID
     *                             example: 123
     *                           favorited_at:
     *                             type: string
     *                             format: date-time
     *                             description: When the product was added to favorites
     *                             example: "2024-01-15T10:30:00Z"
     *                           product_name:
     *                             type: string
     *                             description: Product name
     *                             example: "Áo thun nam basic"
     *                           description:
     *                             type: string
     *                             description: Product description
     *                             example: "Áo thun nam chất liệu cotton 100%"
     *                           base_price:
     *                             type: string
     *                             description: Original product price
     *                             example: "299000.00"
     *                           thumbnail:
     *                             type: string
     *                             description: Product thumbnail URL
     *                             example: "/images/products/thumbnail.jpg"
     *                           sold:
     *                             type: integer
     *                             description: Number of units sold
     *                             example: 150
     *                           slug:
     *                             type: string
     *                             description: Product URL slug
     *                             example: "ao-thun-nam-basic"
     *                           brand_name:
     *                             type: string
     *                             description: Brand name
     *                             example: "Nike"
     *                           category_name:
     *                             type: string
     *                             description: Category name
     *                             example: "Áo thun"
     *                           discount_percent:
     *                             type: number
     *                             nullable: true
     *                             description: Active promotion discount percentage
     *                             example: 20
     *                           discounted_price:
     *                             type: string
     *                             description: Price after discount (if any)
     *                             example: "239200.00"
     *                           has_promotion:
     *                             type: boolean
     *                             description: Whether product has active promotion
     *                             example: true
     *                           available_colors:
     *                             type: array
     *                             description: Available colors for this product
     *                             items:
     *                               type: object
     *                               properties:
     *                                 color_id:
     *                                   type: integer
     *                                   example: 1
     *                                 name:
     *                                   type: string
     *                                   example: "Đỏ"
     *                                 hex_code:
     *                                   type: string
     *                                   example: "#FF0000"
     *                                 primary_image:
     *                                   type: string
     *                                   nullable: true
     *                                   description: Primary image URL for this color
     *                                   example: "/images/products/red-variant.jpg"
     *                           price_info:
     *                             type: object
     *                             description: Detailed pricing information
     *                             properties:
     *                               base_price:
     *                                 type: number
     *                                 description: Original price as number
     *                                 example: 299000
     *                               discounted_price:
     *                                 type: number
     *                                 description: Price after discount as number
     *                                 example: 239200
     *                               discount_percent:
     *                                 type: number
     *                                 nullable: true
     *                                 description: Discount percentage
     *                                 example: 20
     *                               has_promotion:
     *                                 type: boolean
     *                                 description: Whether product has active promotion
     *                                 example: true
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   enum: [error]
     *                 message:
     *                   example: "Error fetching favorites"
     */
    router.get('/', favouriteController.getFavorites);
    router.post('/', favouriteController.addFavorite);
    router.delete('/:id', favouriteController.deleteFavorite);
    
    router.all('/', methodNotAllowed);
    router.all('/:id', methodNotAllowed);
}
