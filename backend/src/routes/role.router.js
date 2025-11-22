const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');
const { methodNotAllowed } = require('../controllers/errors.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

module.exports.setup = (app) => {
    app.use('/api/v1/admin/roles', router);

    /**
     * @swagger
     * /api/v1/admin/roles:
     *   get:
     *     summary: Get all roles
     *     description: Get all roles with statistics (user count, permission count)
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Success
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden
     */
    router.get('/', authMiddleware, checkPermission, rolesController.getRoles);

    /**
     * @swagger
     * /api/v1/admin/roles/{roleId}:
     *   get:
     *     summary: Get role by ID
     *     description: Get detailed information about a specific role
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: roleId
     *         in: path
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Success
     *       404:
     *         description: Role not found
     */
    router.get('/:roleId', authMiddleware, checkPermission, rolesController.getRole);

    /**
     * @swagger
     * /api/v1/admin/roles/{roleId}/permissions:
     *   get:
     *     summary: Get role permissions
     *     description: Get all permissions assigned to a role
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: roleId
     *         in: path
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Success
     *       404:
     *         description: Role not found
     */
    router.get('/:roleId/permissions', authMiddleware, checkPermission, rolesController.getRolePermissions);

    /**
     * @swagger
     * /api/v1/admin/roles/{roleId}/permissions:
     *   put:
     *     summary: Update role permissions
     *     description: Update all permissions for a role (replaces existing permissions)
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: roleId
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
     *               permission_ids:
     *                 type: array
     *                 items:
     *                   type: integer
     *     responses:
     *       200:
     *         description: Permissions updated successfully
     *       400:
     *         description: Invalid input
     *       403:
     *         description: Cannot modify customer permissions
     *       404:
     *         description: Role not found
     */
    router.put('/:roleId/permissions', authMiddleware, checkPermission, rolesController.updateRolePermissions);

    /**
     * @swagger
     * /api/v1/admin/roles/{roleId}/users:
     *   get:
     *     summary: Get users with role
     *     description: Get list of users assigned to a specific role
     *     tags: [Roles]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: roleId
     *         in: path
     *         required: true
     *         schema:
     *           type: integer
     *       - name: page
     *         in: query
     *         schema:
     *           type: integer
     *           default: 1
     *       - name: limit
     *         in: query
     *         schema:
     *           type: integer
     *           default: 20
     *     responses:
     *       200:
     *         description: Success
     *       404:
     *         description: Role not found
     */
    router.get('/:roleId/users', authMiddleware, checkPermission, rolesController.getRoleUsers);

    router.all('/', methodNotAllowed);
    router.all('/:roleId', methodNotAllowed);
    router.all('/:roleId/permissions', methodNotAllowed);
    router.all('/:roleId/users', methodNotAllowed);
};
