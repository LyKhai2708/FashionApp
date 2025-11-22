const express = require("express");
const router = express.Router();
const variantController = require("../controllers/variant.controller");
const { methodNotAllowed } = require("../controllers/errors.controller");
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

/**
 * @swagger
 * tags:
 *   name: Variants
 *   description: Product variant management endpoints
 */

module.exports.setup = (app) => {
    app.use("/api/v1/variants", router);

    /**
     * @swagger
     * /api/v1/variants:
     *   post:
     *     summary: Create a new product variant
     *     description: Create a new variant for a product. Admin only.
     *     tags: [Variants]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateVariantRequest'
     *           example:
     *             product_id: 1
     *             size_id: 2
     *             color_id: 3
     *             stock_quantity: 100
     *             active: 1
     *     responses:
     *       201:
     *         description: Variant created successfully
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
     *                     variant:
     *                       $ref: '#/components/schemas/ProductVariant'
     *             example:
     *               status: success
     *               data:
     *                 variant:
     *                   product_variants_id: 123
     *                   product_id: 1
     *                   size_id: 2
     *                   color_id: 3
     *                   stock_quantity: 100
     *                   active: 1
     *       400:
     *         description: Bad request - Invalid input data
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.post("/", authMiddleware, checkPermission, variantController.addVariant);

    /**
     * @swagger
     * /api/v1/variants/{variantId}:
     *   put:
     *     summary: Update a product variant
     *     description: Update variant information. Admin only.
     *     tags: [Variants]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: variantId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Variant ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateVariantRequest'
     *           example:
     *             size_id: 3
     *             color_id: 2
     *             stock_quantity: 50
     *             active: 1
     *     responses:
     *       200:
     *         description: Variant updated successfully
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
     *                     variant:
     *                       $ref: '#/components/schemas/ProductVariant'
     *       400:
     *         description: Bad request - Invalid input data
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Variant not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.put("/:variantId", authMiddleware, checkPermission, variantController.updateVariant);

    /**
     * @swagger
     * /api/v1/variants/{variantId}:
     *   delete:
     *     summary: Soft delete a variant
     *     description: Soft delete a variant (set active = 0). Admin only.
     *     tags: [Variants]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: variantId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Variant ID
     *     responses:
     *       200:
     *         description: Variant soft deleted successfully
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
     *                     message:
     *                       type: string
     *                       example: "Variant removed"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Variant not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.delete("/:variantId", authMiddleware, checkPermission, variantController.removeVariant);

    /**
     * @swagger
     * /api/v1/variants/{variantId}/permanent:
     *   delete:
     *     summary: Permanently delete a variant
     *     description: Permanently delete a variant from database. Admin only.
     *     tags: [Variants]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: variantId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Variant ID
     *     responses:
     *       200:
     *         description: Variant permanently deleted
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
     *                     message:
     *                       type: string
     *                       example: "Variant deleted"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Variant not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.delete("/:variantId/permanent", authMiddleware, checkPermission, variantController.hardDeleteVariant);

    /**
     * @swagger
     * /api/v1/variants/{variantId}/restore:
     *   patch:
     *     summary: Restore a soft deleted variant
     *     description: Restore a variant (set active = 1). Admin only.
     *     tags: [Variants]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: variantId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Variant ID
     *     responses:
     *       200:
     *         description: Variant restored successfully
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
     *                     message:
     *                       type: string
     *                       example: "Variant restored"
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         description: Variant not found
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    router.patch("/:variantId/restore", authMiddleware, checkPermission, variantController.restoreVariant);

    // Method not allowed handlers
    router.all("/", methodNotAllowed);
    router.all("/:variantId", methodNotAllowed);
    router.all("/:variantId/permanent", methodNotAllowed);
    router.all("/:variantId/restore", methodNotAllowed);
};