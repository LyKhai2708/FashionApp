const express = require('express');
const searchController = require('../controllers/search.controller');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

module.exports.setup = (app) => {
    app.use('/api/v1/search', router);
    
    /**
     * @swagger
     * /api/v1/search/trending:
     *   get:
     *     summary: Get trending keywords
     *     description: Get top trending search keywords from last 24 hours
     *     tags:
     *       - search
     *     parameters:
     *       - name: limit
     *         in: query
     *         description: Number of keywords to return
     *         required: false
     *         schema:
     *           type: integer
     *           default: 6
     *     responses:
     *       200:
     *         description: List of trending keywords
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
     *                     keywords:
     *                       type: array
     *                       items:
     *                         type: string
     */
    router.get('/trending', searchController.getTrendingKeywords);
    
    /**
     * @swagger
     * /api/v1/search/save:
     *   post:
     *     summary: Save search keyword
     *     description: Save a search keyword to history
     *     tags:
     *       - search
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - keyword
     *             properties:
     *               keyword:
     *                 type: string
     *                 description: Search keyword
     *     responses:
     *       201:
     *         description: Keyword saved successfully
     */
    router.post('/', searchController.saveSearch);
    
    router.all('/trending', methodNotAllowed);
    router.all('/', methodNotAllowed);
};