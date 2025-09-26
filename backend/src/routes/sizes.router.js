const express = require('express');
const router = express.Router();
const sizesController = require('../controllers/sizes.controller');
const { methodNotAllowed } = require('../controllers/errors.controller');
module.exports.setup = (app) => {
    app.use('/api/v1/sizes', router);
    
    /**
     * @swagger
     * /api/v1/sizes:
     *   get:
     *     summary: Get sizes by filter
     *     description: Get sizes by filter with pagination
     *     tags:
     *       - sizes
     *     parameters:
     *       - name: name
     *         in: query
     *         description: Filter by size name
     *         required: false
     *         schema:
     *           type: string
     *       - $ref: '#/components/parameters/limitParam'
     *       - $ref: '#/components/parameters/pageParam'
     *     responses:
     *       200:
     *         description: A list of sizes
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
     *                     sizes:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Size'
     *       500:
     *         description: Server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [error]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "An error occurred while fetching sizes"
     */
    router.get('/', sizesController.getSizesByFilter);
    
    /**
     * @swagger
     * /api/v1/sizes:
     *   post:
     *     summary: Create a new size
     *     description: Create a new size
     *     tags:
     *       - sizes
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Size'
     *     responses:
     *       201:
     *         description: A new size created
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
     *                     size:
     *                       $ref: '#/components/schemas/Size'
     *       400:
     *         description: Bad request - Invalid input
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [fail]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "Color name should be a non-empty string"
     *       409:
     *         description: Conflict - Size already exists
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [fail]
     *                 message:
     *                   type: string
     *                   example: "Size already exists"
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [error]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "An error occurred while creating the size"
     */
    router.post('/', sizesController.createSize);
    
    /**
     * @swagger
     * /api/v1/sizes:
     *   delete:
     *     summary: Delete all sizes
     *     description: Delete all sizes
     *     tags:
     *       - sizes
     *     responses:
     *       200:
     *         description: All sizes deleted
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
     *                   nullable: true
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [error]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "An error occurred while removing all Sizes"
     */
    router.delete('/', sizesController.deleteAllSizes);
    router.all('/', methodNotAllowed);
    
    /**
     * @swagger
     * /api/v1/sizes/{id}:
     *   get:
     *     summary: Get a size by id
     *     description: Get a size by id
     *     parameters:
     *       - name: id
     *         in: path
     *         description: Size ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *     tags:
     *       - sizes
     *     responses:
     *       200:
     *         description: A size
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
     *                     size:
     *                       $ref: '#/components/schemas/Size'
     *       404:
     *         description: Size not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [fail]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "Size not found"
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [error]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "Error retrieving Size with id=1"
     */
    router.get('/:id', sizesController.getSize);
    
    /**
     * @swagger
     * /api/v1/sizes/{id}:
     *   put:
     *     summary: Update a size by id
     *     description: Update a size by id
     *     parameters:
     *       - name: id
     *         in: path
     *         description: Size ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *     tags:
     *       - sizes
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Size'
     *     responses:
     *       200:
     *         description: An updated size
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
     *                     size:
     *                       $ref: '#/components/schemas/Size'
     *       400:
     *         description: Bad request - Invalid input
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [fail]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "Data for update cannot be empty"
     *       404:
     *         description: Size not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [fail]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "Size not found"
     *       409:
     *         description: Size with the same name already exists
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [fail]
     *                 message:
     *                   type: string
     *                   example: "Size already exists"
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [error]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "Error updating Size with id=1"
     */
    router.put('/:id', sizesController.updateSize);
    
    /**
     * @swagger
     * /api/v1/sizes/{id}:
     *   delete:
     *     summary: Delete a size by id
     *     description: Delete a size by id
     *     parameters:
     *       - name: id
     *         in: path
     *         description: Size ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *     tags:
     *       - sizes
     *     responses:
     *       200:
     *         description: Size deleted successfully
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
     *                   nullable: true
     *       404:
     *         description: Size not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [fail]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "Size not found"
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [error]
     *                 message:
     *                   type: string
     *                   description: A human-readable error message
     *                   example: "Could not delete Size with id=1"
     */
    router.delete('/:id', sizesController.deleteSize);
    router.all('/:id', methodNotAllowed);
}