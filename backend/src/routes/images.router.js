const express = require('express');
const router = express.Router();
const imagesController = require('../controllers/images.controller');
const { methodNotAllowed } = require('../controllers/errors.controller');
const { uploadSingle } = require('../middleware/upload_image.middleware');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Product image management endpoints
 */

module.exports.setup = (app) => {
    app.use('/api/v1/images', router);

    /**
     * @swagger
     * /api/v1/images:
     *   get:
     *     summary: Get product images
     *     description: Retrieve product images with pagination and filtering options
     *     tags: [Images]
     *     parameters:
     *       - in: query
     *         name: product_color_id
     *         schema:
     *           type: integer
     *         description: Filter by product color ID
     *       - $ref: '#/components/parameters/pageParam'
     *       - $ref: '#/components/parameters/limitParam'
     *     responses:
     *       200:
     *         description: Images retrieved successfully
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
     *                     images:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Image'
     *                     metadata:
     *                       $ref: '#/components/schemas/PaginationMetadata'
     *             example:
     *               status: success
     *               data:
     *                 images:
     *                   - image_id: 1
     *                     product_color_id: 5
     *                     image_url: "/public/uploads/product1_red.jpg"
     *                   - image_id: 2
     *                     product_color_id: 5
     *                     image_url: "/public/uploads/product1_red_2.jpg"
     *                 metadata:
     *                   page: 1
     *                   limit: 5
     *                   totalRecords: 10
     *                   totalPages: 2
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.get('/', imagesController.getImages);

    /**
     * @swagger
     * /api/v1/images:
     *   post:
     *     summary: Upload product image
     *     description: Upload a new image for a product color. Admin only.
     *     tags: [Images]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - imageFile
     *               - product_color_id
     *             properties:
     *               imageFile:
     *                 type: string
     *                 format: binary
     *                 description: Image file to upload
     *               product_color_id:
     *                 type: integer
     *                 description: Product color ID to associate with the image
     *                 example: 5
     *     responses:
     *       201:
     *         description: Image uploaded successfully
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
     *                     image:
     *                       $ref: '#/components/schemas/Image'
     *             example:
     *               status: success
     *               data:
     *                 image:
     *                   image_id: 123
     *                   product_color_id: 5
     *                   image_url: "/public/uploads/1696234567890_product.jpg"
     *       400:
     *         description: Bad request - Missing file or invalid data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *             examples:
     *               missing_file:
     *                 summary: Missing image file
     *                 value:
     *                   status: error
     *                   message: "Image file is required"
     *               missing_product_color:
     *                 summary: Missing product color ID
     *                 value:
     *                   status: error
     *                   message: "product_color_id is required"
     *               invalid_product_color:
     *                 summary: Invalid product color
     *                 value:
     *                   status: error
     *                   message: "Product color not found"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.post('/', authMiddleware, authorizeRoles(['admin']), uploadSingle('imageFile'), imagesController.addImage);

    /**
     * @swagger
     * /api/v1/images/{id}:
     *   delete:
     *     summary: Delete product image
     *     description: Delete a product image and remove the file from server. Admin only.
     *     tags: [Images]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Image ID
     *         example: 123
     *     responses:
     *       200:
     *         description: Image deleted successfully
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
     *                       example: "Image removed successfully"
     *                     image:
     *                       $ref: '#/components/schemas/Image'
     *             example:
     *               status: success
     *               data:
     *                 message: "Image removed successfully"
     *                 image:
     *                   image_id: 123
     *                   product_color_id: 5
     *                   image_url: "/public/uploads/1696234567890_product.jpg"
     *       400:
     *         description: Invalid image ID
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Image not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.delete('/:id', authMiddleware, authorizeRoles(['admin']), imagesController.removeImage);

    // Method not allowed handlers
    router.all('/', methodNotAllowed);
    router.all('/:id', methodNotAllowed);
};
