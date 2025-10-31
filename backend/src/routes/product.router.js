const express = require("express");
const router = express.Router();
const productController = require("../controllers/products.controller");
const imageSearchController = require("../controllers/imageSearch.controller");
const { methodNotAllowed } = require("../controllers/errors.controller");
const {authMiddleware, authorizeRoles, optionalAuthMiddleware} = require('../middleware/auth.middleware');
const { uploadSingle, uploadMultiple } = require("../middleware/upload_image.middleware");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

module.exports.setup = (app) => {
    app.use("/api/v1/products", router);

    /**
     * @swagger
     * /api/v1/products:
     *   get:
     *     summary: Get products list
     *     description: Get paginated list of products with filtering and search capabilities
     *     tags: [Products]
     *     parameters:
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
     *         description: Number of products per page
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term for product name
     *       - in: query
     *         name: category_id
     *         schema:
     *           type: integer
     *         description: Filter by category ID
     *       - in: query
     *         name: brand_id
     *         schema:
     *           type: integer
     *         description: Filter by brand ID
     *       - in: query
     *         name: min_price
     *         schema:
     *           type: number
     *           format: float
     *         description: Minimum price filter
     *       - in: query
     *         name: max_price
     *         schema:
     *           type: number
     *           format: float
     *         description: Maximum price filter
     *       - in: query
     *         name: sort
     *         schema:
     *           type: string
     *           enum: [price_asc, price_desc, newest]
     *           default: newest
     *         description: Sort order
     *     responses:
     *       200:
     *         description: Products retrieved successfully
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
     *                     products:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Product'
     *                     metadata:
     *                       $ref: '#/components/schemas/PaginationMetadata'
     *             example:
     *               status: success
     *               data:
     *                 products:
     *                   - product_id: 1
     *                     name: "iPhone 15 Pro"
     *                     description: "Latest iPhone model"
     *                     base_price: 25000000
     *                     thumbnail: "/public/uploads/iphone15.jpg"
     *                     brand_name: "Apple"
     *                     category_name: "Smartphones"
     *                 metadata:
     *                   totalRecords: 50
     *                   firstPage: 1
     *                   lastPage: 5
     *                   page: 1
     *                   limit: 10
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.get("/", optionalAuthMiddleware, productController.getProducts);

    /**
     * @swagger
     * /api/v1/products:
     *   post:
     *     summary: Create a new product
     *     description: Create a new product with variants and images. Admin only.
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - description
     *               - base_price
     *               - category_id
     *               - brand_id
     *             properties:
     *               name:
     *                 type: string
     *                 description: Product name
     *                 example: "iPhone 15 Pro"
     *               description:
     *                 type: string
     *                 description: Product description
     *                 example: "Latest iPhone model with advanced features"
     *               base_price:
     *                 type: number
     *                 format: float
     *                 description: Base price of the product
     *                 example: 25000000
     *               category_id:
     *                 type: integer
     *                 description: Category ID
     *                 example: 1
     *               brand_id:
     *                 type: integer
     *                 description: Brand ID
     *                 example: 1
     *               variants:
     *                 type: string
     *                 description: JSON string of product variants
     *                 example: '[{"size_id":1,"color_id":1,"price":25000000,"stock_quantity":10,"imageCount":2}]'
     *               images:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: binary
     *                 description: Product images (max 30 files)
     *     responses:
     *       201:
     *         description: Product created successfully
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
     *                     product:
     *                       $ref: '#/components/schemas/Product'
     *             example:
     *               status: success
     *               data:
     *                 product:
     *                   product_id: 123
     *                   name: "iPhone 15 Pro"
     *                   description: "Latest iPhone model"
     *                   base_price: 25000000
     *       400:
     *         description: Bad request - Invalid input data
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.post("/", authMiddleware, authorizeRoles(['admin']), uploadMultiple('images', 30), productController.createProduct);

    /**
     * @swagger
     * /api/v1/products/{id}:
     *   get:
     *     summary: Get product by ID
     *     description: Get detailed information about a specific product including variants
     *     tags: [Products]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Product ID
     *     responses:
     *       200:
     *         description: Product retrieved successfully
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
     *                     product:
     *                       $ref: '#/components/schemas/ProductDetail'
     *             example:
     *               status: success
     *               data:
     *                 product:
     *                   product_id: 1
     *                   name: "iPhone 15 Pro"
     *                   description: "Latest iPhone model"
     *                   base_price: 25000000
     *                   thumbnail: "/public/uploads/iphone15.jpg"
     *                   variants:
     *                     - variant_id: 1
     *                       size_name: "128GB"
     *                       color_name: "Black"
     *                       price: 25000000
     *                       stock_quantity: 10
     *       404:
     *         description: Product not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.get("/:id", productController.getProductById);

    /**
     * @swagger
     * /api/v1/products/by-ids:
     *   post:
     *     summary: Get products by IDs
     *     description: Retrieve multiple products by their IDs 
     *     tags: [Products]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               ids:
     *                 type: array
     *                 items:
     *                   type: integer
     *                 example: [1, 2, 3, 4, 5]
     *     responses:
     *       200:
     *         description: Products retrieved successfully
     *       400:
     *         description: Invalid request
     *       500:
     *         description: Server error
     */
    router.post("/by-ids", productController.getProductsByIds);

    /**
     * @swagger
     * /api/v1/products/{id}:
     *   patch:
     *     summary: Update product
     *     description: Update product information. Admin only.
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Product ID
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 description: Product name
     *               description:
     *                 type: string
     *                 description: Product description
     *               base_price:
     *                 type: number
     *                 format: float
     *                 description: Base price
     *               category_id:
     *                 type: integer
     *                 description: Category ID
     *               brand_id:
     *                 type: integer
     *                 description: Brand ID
     *               thumbnail:
     *                 type: string
     *                 format: binary
     *                 description: New thumbnail image
     *     responses:
     *       200:
     *         description: Product updated successfully
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
     *                     product:
     *                       $ref: '#/components/schemas/Product'
     *       400:
     *         description: Bad request - No data to update
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Product not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.patch("/:id", authMiddleware, authorizeRoles(['admin']), uploadMultiple('images', 30), productController.updateProduct);

    /**
     * @swagger
     * /api/v1/products/{id}:
     *   delete:
     *     summary: Soft delete product
     *     description: Soft delete a product (mark as deleted). Admin only.
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Product ID
     *     responses:
     *       200:
     *         description: Product deleted successfully
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
     *                       example: "Product deleted"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Product not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.delete("/:id", authMiddleware, authorizeRoles(['admin']), productController.deleteProduct);

    /**
     * @swagger
     * /api/v1/products/{id}/permanent:
     *   delete:
     *     summary: Permanently delete product
     *     description: Permanently delete a product from database. Admin only.
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Product ID
     *     responses:
     *       200:
     *         description: Product permanently deleted
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
     *                       example: "Product deleted"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Product not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.delete("/:id/permanent", authMiddleware, authorizeRoles(['admin']), productController.hardDeleteProduct);

    /**
     * @swagger
     * /api/v1/products/{id}/restore:
     *   put:
     *     summary: Restore deleted product
     *     description: Restore a soft-deleted product (set del_flag to 0). Admin only.
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Product ID
     *     responses:
     *       200:
     *         description: Product restored successfully
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
     *                       example: "Product restored"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Product not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.put("/:id/restore", authMiddleware, authorizeRoles(['admin']), productController.restoreProduct);

    /**
     * Image Search Endpoint
     * POST /api/v1/products/search-by-image
     * Upload image and get similar products
     */
    router.post("/search-by-image", uploadSingle('image'), imageSearchController.searchByImage);

    router.all("/", methodNotAllowed);
    router.all("/:id", methodNotAllowed);
    router.all("/:id/permanent", methodNotAllowed);
    router.all("/:id/restore", methodNotAllowed);
    router.all("/search-by-image", methodNotAllowed);
}
