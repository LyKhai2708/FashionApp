const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { optionalAuthMiddleware } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/chat', router);
    
    /**
     * @swagger
     * /api/v1/chat/message:
     *   post:
     *     summary: Send message to chatbot
     *     tags: [Chat]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               message:
     *                 type: string
     *               guest_token:
     *                 type: string
     *     responses:
     *       200:
     *         description: Bot response
     */
    router.post('/message', optionalAuthMiddleware, chatController.sendMessage);
    
    /**
     * @swagger
     * /api/v1/chat/history:
     *   get:
     *     summary: Get chat history
     *     tags: [Chat]
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Chat history
     */
    router.get('/history', optionalAuthMiddleware, chatController.getChatHistory);
    
    router.post('/session/:session_id/end', optionalAuthMiddleware, chatController.endSession);
    router.get('/stats', optionalAuthMiddleware, chatController.getStats);
    
    router.all('/message', methodNotAllowed);
    router.all('/history', methodNotAllowed);
};