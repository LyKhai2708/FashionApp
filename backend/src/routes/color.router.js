const express = require('express');
const colorsController = require('../controllers/colors.controller');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/colors', router);
    /**
     * @swagger
     * /api/v1/colors:
     *   get:
     *     summary: Get colors by filter
     *     description: Get colors with optional filtering and pagination
     *     tags:
     *       - colors
     *     parameters:
     *       - name: name
     *         in: query
     *         description: Filter by color name
     *         required: false
     *         schema:
     *           type: string
     *       - $ref: '#/components/parameters/limitParam'
     *       - $ref: '#/components/parameters/pageParam'
     *     responses:
     *       200:
     *         description: List of colors
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
     *                     colors:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Color'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.get('/', colorsController.getColorsByFilter);
    /**
     * @swagger
     * /api/v1/colors:
     *   post:
     *     summary: Create a new color
     *     description: Create a new color
     *     tags:
     *       - colors
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *                 description: Color name
     *                 example: "Red"
     *               hex_code:
     *                 type: string
     *                 description: Hex color code
     *                 pattern: "^#[0-9A-Fa-f]{6}$"
     *                 example: "#FF0000"
     *     responses:
     *       201:
     *         description: Color created successfully
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
     *                     color:
     *                       $ref: '#/components/schemas/Color'
     *       400:
     *         description: Bad request - Invalid color name
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
     *                   example: "Color name should be a non-empty string"
     *       409:
     *         description: Conflict - Color already exists
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
     *                   example: "Color already exists"
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
     *                   example: "An error occurred while creating the color"
     */
    router.post('/', colorsController.createColor);
    /**
     * @swagger
     * /api/v1/colors:
     *   delete:
     *     summary: Delete all colors
     *     description: Delete all colors
     *     tags:
     *       - colors
     *     responses:
     *       200:
     *         $ref: '#/components/responses/200NoData'
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
     *                   example: "An error occurred while removing all Colors"
     */
    router.delete('/', colorsController.deleteAllColors);
    router.all('/', methodNotAllowed);
    /**
     * @swagger
     * /api/v1/colors/{id}:
     *   get:
     *     summary: Get a color by ID
     *     description: Get a specific color by its ID
     *     tags:
     *       - colors
     *     parameters:
     *       - $ref: '#/components/parameters/colorIdParam'
     *     responses:
     *       200:
     *         description: Color found
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
     *                     color:
     *                       $ref: '#/components/schemas/Color'
     *       404:
     *         description: Color not found
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
     *                   example: "Color not found"
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
     *                   example: "Error retrieving Color with id=1"
     */
    router.get('/:id', colorsController.getColor);
    /**
     * @swagger
     * /api/v1/colors/{id}:
     *   put:
     *     summary: Update a color by ID
     *     description: Update a specific color by its ID
     *     tags:
     *       - colors
     *     parameters:
     *       - $ref: '#/components/parameters/colorIdParam'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 description: Color name
     *                 example: "Blue"
     *               hex_code:
     *                 type: string
     *                 description: Hex color code
     *                 pattern: "^#[0-9A-Fa-f]{6}$"
     *                 example: "#0000FF"
     *     responses:
     *       200:
     *         description: Color updated successfully
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
     *                     color:
     *                       $ref: '#/components/schemas/Color'
     *       400:
     *         description: Bad request - Empty data
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
     *                   example: "Data for update cannot be empty"
     *       404:
     *         description: Color not found
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
     *                   example: "Color not found"
     *       409:
     *         description: Conflict - Color already exists
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
     *                   example: "Color already exists"
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
     *                   example: "Error updating Color with id=1"
     */
    router.put('/:id', colorsController.updateColor);
    /**
     * @swagger
     * /api/v1/colors/{id}:
     *   delete:
     *     summary: Delete a color by ID
     *     description: Delete a specific color by its ID
     *     tags:
     *       - colors
     *     parameters:
     *       - $ref: '#/components/parameters/colorIdParam'
     *     responses:
     *       200:
     *         $ref: '#/components/responses/200NoData'
     *       404:
     *         description: Color not found
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
     *                   example: "Color not found"
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
     *                   example: "Could not delete Color with id=1"
     */
    router.delete('/:id', colorsController.deleteColor);
    router.all('/:id', methodNotAllowed);
}