const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { methodNotAllowed } = require('../controllers/errors.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

module.exports.setup = (app) => {
    app.use('/api/v1/users', router);

    router.get('/profile', authMiddleware, usersController.getMyInformation);
    router.patch('/password', authMiddleware, usersController.changePassword);
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
     *       - name: is_active
     *         in: query
     *         description: Filter by active status
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

    /**
     * @swagger
     * /api/v1/users:
     *   post:
     *     summary: Create a new user
     *     description: Create a new user and optionally assign a role (admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - email
     *               - password
     *             properties:
     *               username:
     *                 type: string
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *                 minLength: 8
     *               phone:
     *                 type: string
     *               role_id:
     *                 type: integer
     *                 description: ID của role cần gán (optional)
     *     responses:
     *       201:
     *         description: User created successfully
     *       400:
     *         description: Invalid input
     *       403:
     *         description: Forbidden
     */
    router.post('/', authMiddleware, checkPermission, usersController.createUser);

    router.get('/', authMiddleware, checkPermission, usersController.getUsers);

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
    router.get('/:id', authMiddleware, usersController.getUser);

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
    router.patch('/:id', authMiddleware, usersController.updateUser);

    /**
     * @swagger
     * /api/v1/users/{id}:
     *   delete:
     *     summary: Disable a user by id
     *     description: Disable a user by id (sets is_active to 0)
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
    router.delete('/:id', authMiddleware, checkPermission, usersController.deleteUser);

    /**
     * @swagger
     * /api/v1/users/{id}/role:
     *   get:
     *     summary: Get user's role
     *     description: Get the current role assigned to a user (admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Success
     *       404:
     *         description: User not found
     */
    router.get('/:id/role', authMiddleware, checkPermission, usersController.getUserRole);

    /**
     * @swagger
     * /api/v1/users/{id}/role:
     *   put:
     *     summary: Update user's role
     *     description: Update the role assigned to a user. Replaces existing role (admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               role_id:
     *                 type: integer
     *                 description: ID of the role to assign
     *     responses:
     *       200:
     *         description: Role updated successfully
     *       400:
     *         description: Invalid input
     *       404:
     *         description: User not found
     */
    router.put('/:id/role', authMiddleware, checkPermission, usersController.updateUserRole);

    router.all('/', methodNotAllowed);
    router.all('/:id/role', methodNotAllowed);
}
