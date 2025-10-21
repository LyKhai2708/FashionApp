const express = require('express');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');
const categoryController = require('../controllers/categories.controller');
const {authMiddleware, authorizeRoles} = require('../middleware/auth.middleware');
module.exports.setup = (app) => {
    app.use('/api/v1/categories', router);
    /**
     * @swagger
     * /api/v1/categories:
     *   get:
     *     summary: Get categories by filter
     *     description: Get categories with optional filtering by name, parent_id and pagination
     *     tags:
     *       - categories
     *     parameters:
     *       - name: name
     *         in: query
     *         description: Filter by category name (case insensitive)
     *         required: false
     *         schema:
     *           type: string
     *       - name: parent_id
     *         in: query
     *         description: Filter by parent category ID (null for root categories)
     *         required: false
     *         schema:
     *           type: integer
     *           nullable: true
     *       - $ref: '#/components/parameters/limitParam'
     *       - $ref: '#/components/parameters/pageParam'
     *     responses:
     *       200:
     *         description: List of categories
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
     *                     metadata:
     *                       $ref: '#/components/schemas/PaginationMetadata'
     *                     categories:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Category'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.get('/', categoryController.getCategoriesbyFilter);
    /**
     * @swagger
     * /api/v1/categories:
     *   post:
     *     summary: Create a new category
     *     description: Create a new category (Admin only)
     *     tags:
     *       - categories
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - category_name
     *             properties:
     *               category_name:
     *                 type: string
     *                 description: Category name
     *                 example: "Electronics"
     *               parent_id:
     *                 type: integer
     *                 nullable: true
     *                 description: Parent category ID for hierarchical structure
     *                 example: null
     *               slug:
     *                 type: string
     *                 description: Custom slug (optional, auto-generated from name if not provided)
     *                 example: "electronics"
     *     responses:
     *       201:
     *         description: Category created successfully
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
     *                     category:
     *                       $ref: '#/components/schemas/Category'
     *       400:
     *         description: Bad request - Invalid category name
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
     *                   example: "Category name should be non-empty string"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       409:
     *         description: Conflict - Category name already exists
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
     *                   example: "Category name already exists"
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
     *                   type: string
     *                   example: "An error occurred while creating category"
     */
    router.post('/',authMiddleware,authorizeRoles('admin'), categoryController.createCategory);
    /**
     * @swagger
     * /api/v1/categories:
     *   delete:
     *     summary: Delete all categories
     *     description: Soft delete all categories by setting active to 0 (Admin only)
     *     tags:
     *       - categories
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         $ref: '#/components/responses/200NoData'
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
     *                   type: string
     *                   example: "Error deleting all categories"
     */
    router.delete('/',authMiddleware,authorizeRoles('admin'), categoryController.deleteAllCategories);
    router.all('/', methodNotAllowed);
    /**
     * @swagger
     * /api/v1/categories/{category_id}:
     *   put:
     *     summary: Update a category by ID
     *     description: Update a specific category by its ID (Admin only)
     *     tags:
     *       - categories
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/categoryIdParam'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               category_name:
     *                 type: string
     *                 description: Category name
     *                 example: "Updated Electronics"
     *               parent_id:
     *                 type: integer
     *                 nullable: true
     *                 description: Parent category ID
     *                 example: 1
     *               slug:
     *                 type: string
     *                 description: Custom slug (optional)
     *                 example: "updated-electronics"
     *     responses:
     *       200:
     *         description: Category updated successfully
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
     *                     category:
     *                       $ref: '#/components/schemas/Category'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Category not found
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
     *                   example: "Category not found"
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
     *                   type: string
     *                   example: "Error updating category"
     */
    router.put('/:category_id',authMiddleware,authorizeRoles('admin'), categoryController.updateCategory);
    /**
     * @swagger
     * /api/v1/categories/{category_id}:
     *   delete:
     *     summary: Delete a category by ID
     *     description: Soft delete a specific category by setting active to 0 (Admin only)
     *     tags:
     *       - categories
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/categoryIdParam'
     *     responses:
     *       200:
     *         description: Category deleted successfully
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
     *                     category:
     *                       $ref: '#/components/schemas/Category'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Category not found
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
     *                   example: "Category not found"
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
     *                   type: string
     *                   example: "Error deleting category"
     */
    router.delete('/:category_id',authMiddleware,authorizeRoles('admin'), categoryController.deleteCategory);
    /**
     * @swagger
     * /api/v1/categories/{id}:
     *   get:
     *     summary: Get a category by ID
     *     description: Get a specific category by its ID
     *     tags:
     *       - categories
     *     parameters:
     *       - $ref: '#/components/parameters/categoryIdParam'
     *     responses:
     *       200:
     *         description: Category found
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
     *                     category:
     *                       $ref: '#/components/schemas/Category'
     *       404:
     *         description: Category not found
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
     *                   example: "Category not found"
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
     *                   type: string
     *                   example: "Error fetching category"
     */
    router.get('/:id', categoryController.getCategory);
    router.patch('/:id/toggle', categoryController.toggleCategoryStatus);
    router.all('/:id', methodNotAllowed);
}