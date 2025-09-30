const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/auth', router);
    
    /**
     * @swagger
     * /api/v1/auth/register:
     *   post:
     *     summary: User registration
     *     description: Register a new user account
     *     tags:
     *       - authentication
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
     *                 description: User's display name
     *                 example: "John Doe"
     *               email:
     *                 type: string
     *                 format: email
     *                 description: User email address (must be unique)
     *                 example: "john.doe@example.com"
     *               password:
     *                 type: string
     *                 format: password
     *                 minLength: 6
     *                 description: User password (minimum 6 characters)
     *                 example: "password123"
     *               phone:
     *                 type: string
     *                 description: User phone number (optional)
     *                 example: "0987654321"
     *               address:
     *                 type: string
     *                 description: User address (optional)
     *                 example: "123 Main Street, City"
     *               role:
     *                 type: string
     *                 description: User role (defaults to customer)
     *                 enum: [customer, admin]
     *                 example: "customer"
     *     responses:
     *       201:
     *         description: User registered successfully
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
     *                       type: object
     *                       properties:
     *                         user_id:
     *                           type: integer
     *                           description: User ID
     *                           example: 1
     *                         username:
     *                           type: string
     *                           description: User's display name
     *                           example: "John Doe"
     *                         email:
     *                           type: string
     *                           format: email
     *                           description: User email
     *                           example: "john.doe@example.com"
     *                         phone:
     *                           type: string
     *                           description: User phone number
     *                           example: "0987654321"
     *                         address:
     *                           type: string
     *                           description: User address
     *                           example: "123 Main Street, City"
     *                         role:
     *                           type: string
     *                           description: User role
     *                           enum: [customer, admin]
     *                           example: "customer"
     *                     message:
     *                       type: string
     *                       description: Success message
     *                       example: "User registered successfully"
     *       400:
     *         description: Bad request - Validation errors
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
     *                   examples:
     *                     missing_fields:
     *                       value: "Username, email and password are required"
     *                     invalid_email:
     *                       value: "Invalid email format"
     *                     weak_password:
     *                       value: "Password must be at least 6 characters long"
     *       409:
     *         description: Conflict - User already exists
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
     *                   example: "User with this email already exists"
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
     *                   example: "An error occurred while registering user"
     */
    router.post('/register', authController.register);
    
    /**
     * @swagger
     * /api/v1/auth/login:
     *   post:
     *     summary: User login
     *     description: Authenticate user with email and password
     *     tags:
     *       - authentication
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 description: User email address
     *                 example: "user@example.com"
     *               password:
     *                 type: string
     *                 format: password
     *                 description: User password
     *                 example: "password123"
     *     responses:
     *       200:
     *         description: Login successful
     *         headers:
     *           Set-Cookie:
     *             description: Refresh token cookie
     *             schema:
     *               type: string
     *               example: "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800"
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
     *                       type: object
     *                       properties:
     *                         id:
     *                           type: integer
     *                           description: User ID
     *                           example: 1
     *                         email:
     *                           type: string
     *                           format: email
     *                           description: User email
     *                           example: "user@example.com"
     *                         role:
     *                           type: string
     *                           description: User role
     *                           enum: [customer, admin]
     *                           example: "customer"
     *                     accessToken:
     *                       type: string
     *                       description: JWT access token
     *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     *       400:
     *         description: Bad request - Missing email or password
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
     *                   example: "Email and password are required"
     *       401:
     *         description: Unauthorized - Invalid credentials
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
     *                   example: "Invalid email or password"
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
     *                   example: "An error occurred while logging in"
     */
    router.post('/login', authController.login);
    
    /**
     * @swagger
     * /api/v1/auth/refresh:
     *   post:
     *     summary: Refresh access token
     *     description: Generate a new access token using refresh token from cookie
     *     tags:
     *       - authentication
     *     parameters:
     *       - name: Cookie
     *         in: header
     *         description: Refresh token cookie
     *         required: true
     *         schema:
     *           type: string
     *           example: "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     *     responses:
     *       200:
     *         description: Token refreshed successfully
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
     *                     accessToken:
     *                       type: string
     *                       description: New JWT access token
     *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     *       401:
     *         description: Unauthorized - No refresh token or invalid user
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
     *                   example: "No refresh token"
     *       403:
     *         description: Forbidden - Invalid refresh token
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
     *                   example: "Invalid refresh token"
     */
    router.post('/refresh', authController.refresh);
    
    /**
     * @swagger
     * /api/v1/auth/logout:
     *   post:
     *     summary: User logout
     *     description: Clear refresh token cookie and logout user
     *     tags:
     *       - authentication
     *     responses:
     *       200:
     *         description: Logout successful
     *         headers:
     *           Set-Cookie:
     *             description: Clear refresh token cookie
     *             schema:
     *               type: string
     *               example: "refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   description: The response status
     *                   enum: [success]
     *                 message:
     *                   type: string
     *                   description: Success message
     *                   example: "Logged out"
     */
    router.post('/logout', authController.logout);
    router.all('/', methodNotAllowed);
}

