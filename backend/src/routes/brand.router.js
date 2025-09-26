const express = require('express');
const multer = require('multer');
const brandController = require('../controllers/brand.controller');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');
const upload = multer();
module.exports.setup = (app) => {
    app.use('/api/v1/brands', router);
    /**
     * @swagger
     * /api/v1/brands:
     *   get:
     *     summary: Get brands by filter
     *     description: Get brands by filter
     *     tags:
     *       - brands
     *     parameters:
     *       - name: name
     *         in: query
     *         description: Filter by name
     *         required: false
     *         schema:
     *           type: string
     *       - name: active
     *         in: query
     *         description: Filter by active status
     *         required: false
     *         schema:
     *           type: boolean
     *       - $ref: '#/components/parameters/limitParam'
     *       - $ref: '#/components/parameters/pageParam'
     *     responses:
     *       200:
     *         description: An list of brands
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
     *                     brands:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Brand'
     */                    
    router.get('/', brandController.getBrandbyFilter);
    /**
     * @swagger
     * /api/v1/brands:
     *   post:
     *     summary: Create a new brand
     *     description: Create a new brand
     *     tags:
     *         - brands
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             $ref: '#/components/schemas/Brand'
     *     responses:
     *         201:
     *           description: A new brand
     *           content:
     *             application/json:
     *               schema:
     *                 type: object
     *                 properties:
     *                   status:
     *                     type: string
     *                     description: The response status
     *                     enum: [success]
     *                   data:
     *                     type: object
     *                     properties:
     *                       brand:
     *                         $ref: '#/components/schemas/Brand'
     * 
    */
    router.post('/', upload.none(), brandController.createBrand);
    /**
     * @swagger
     * /api/v1/brands:
     *   delete:
     *     summary: Delete all brands
     *     description: Delete all brands
     *     tags:
     *       - brands
     *     responses:
     *       200:
     *         description: All brands deleted
     *         $ref: '#/components/responses/200NoData'
     */
    router.delete('/', brandController.deleteAllBrands);
    router.all('/', methodNotAllowed);
    /**
     * @swagger
     * /api/v1/brands/{id}:
     *   get:
     *     summary: Get a brand by id
     *     description: Get a brand by id
     *     parameters:
     *       - $ref: '#/components/parameters/brandIdParam'
     *     tags:
     *       - brands
     *     responses:
     *       200:
     *         description: A brand
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
     *                     brand:
     *                       $ref: '#/components/schemas/Brand'
     */
    router.get('/:id', brandController.getBrand);
    /**
     * @swagger
     * /api/v1/brands/{id}:
     *   put:
     *     summary: Update a brand by id
     *     description: Update a brand by id
     *     parameters:
     *       - $ref: '#/components/parameters/brandIdParam'
     *     tags:
     *       - brands
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Brand'
     *     responses:
     *       200:
     *         description: An updated brand
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
     *                     brand:
     *                       $ref: '#/components/schemas/Brand'
     */
    router.put('/:id', brandController.updateBrand);
    /**
     * @swagger
     * /api/v1/brands/{id}:
     *   delete:
     *     summary: Delete a brand by id
     *     description: Delete a brand by id
     *     parameters:
     *       - $ref: '#/components/parameters/brandIdParam'
     *     tags:
     *       - brands
     *     responses:
     *       200:
     *         $ref: '#/components/responses/200NoData'
     */
    router.delete('/:id', brandController.deleteBrand);
    router.all('/:id', methodNotAllowed);
}
