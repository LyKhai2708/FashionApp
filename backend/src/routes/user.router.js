const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/users', router);
    
    /**
     * @swagger
     * /api/v1/users:
     *   get:
     *     summary: Get users by filter
     *     description: Get users by filter with pagination
     *     tags:
     *       - users
     *     parameters:
     *       - name: name
     *         in: query
     *         description: Filter by username
     *         required: false
     *         schema:
     *           type: string
     *       - name: email
     *         in: query
     *         description: Filter by email
     *         required: false
     *         schema:
     *           type: string
     *       - name: phone
     *         in: query
     *         description: Filter by phone number
     *         required: false
     *         schema:
     *           type: string
     *       - name: role
     *         in: query
     *         description: Filter by user role
     *         required: false
     *         schema:
     *           type: string
     *           enum: [customer, admin]
     *       - name: del_flag
     *         in: query
     *         description: Filter by deletion status
     *         required: false
     *         schema:
     *           type: boolean
     *       - $ref: '#/components/parameters/limitParam'
     *       - $ref: '#/components/parameters/pageParam'
     *     responses:
     *       200:
     *         description: A list of users
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
     *                     users:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/User'
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
     *                   example: "Error fetching users"
     */
    router.get('/', usersController.getUsers);
    
    /**
     * @swagger
     * /api/v1/users/{id}:
     *   get:
     *     summary: Get a user by id
     *     description: Get a user by id
     *     parameters:
     *       - name: id
     *         in: path
     *         description: User ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *     tags:
     *       - users
     *     responses:
     *       200:
     *         description: A user
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
     *                     user:
     *                       $ref: '#/components/schemas/User'
     *       404:
     *         description: User not found
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
     *                   example: "User not found"
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
     *                   example: "Error fetching user"
     */
    router.get('/:id', usersController.getUser);
    
    /**
     * @swagger
     * /api/v1/users/{id}:
     *   patch:
     *     summary: Update a user by id
     *     description: Update a user by id (partial update)
     *     parameters:
     *       - name: id
     *         in: path
     *         description: User ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *     tags:
     *       - users
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/User'
     *     responses:
     *       200:
     *         description: An updated user
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
     *                     user:
     *                       $ref: '#/components/schemas/User'
     *       404:
     *         description: User not found
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
     *                   example: "User not found"
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
     *                   example: "Error updating user"
     */
    router.patch('/:id', usersController.updateUser);
    
    /**
     * @swagger
     * /api/v1/users/{id}:
     *   delete:
     *     summary: Delete a user by id (soft delete)
     *     description: Delete a user by id using soft delete (sets del_flag to 1)
     *     parameters:
     *       - name: id
     *         in: path
     *         description: User ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *     tags:
     *       - users
     *     responses:
     *       200:
     *         description: User deleted successfully
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
     *                     user:
     *                       $ref: '#/components/schemas/User'
     *       404:
     *         description: User not found
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
     *                   example: "User not found"
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
     *                   example: "Error deleting user"
     */
    router.delete('/:id', usersController.deleteUser);
    router.all('/', methodNotAllowed);
}
