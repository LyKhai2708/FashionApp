const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const {authMiddleware } = require('../middleware/auth.middleware');

module.exports.setup = (app) => {
app.use('/api/v1/addresses', router);
router.use(authMiddleware);

    /**
 * @swagger
 * /api/v1/addresses:
 *   get:
 *     summary: Get all addresses of current user
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses
 */
    router.get('/', addressController.getUserAddresses);

    /**
     * @swagger
     * /api/v1/addresses/default:
     *   get:
     *     summary: Get default address
     *     tags: [Addresses]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Default address
     */
    router.get('/default', addressController.getDefaultAddress);

    /**
     * @swagger
     * /api/v1/addresses:
     *   post:
     *     summary: Create new address
     *     tags: [Addresses]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - province
     *               - district
     *               - ward
     *               - detail_address
     *             properties:
     *               province:
     *                 type: string
     *               district:
     *                 type: string
     *               ward:
     *                 type: string
     *               detail_address:
     *                 type: string
     *               is_default:
     *                 type: boolean
     *     responses:
     *       201:
     *         description: Address created
     */
    router.post('/', addressController.createAddress);

    /**
     * @swagger
     * /api/v1/addresses/{id}:
     *   put:
     *     summary: Update address
     *     tags: [Addresses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Address updated
     */
    router.put('/:id', addressController.updateAddress);

    /**
     * @swagger
     * /api/v1/addresses/{id}:
     *   delete:
     *     summary: Delete address
     *     tags: [Addresses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Address deleted
     */
    router.delete('/:id', addressController.deleteAddress);

    /**
     * @swagger
     * /api/v1/addresses/{id}/default:
     *   patch:
     *     summary: Set address as default
     *     tags: [Addresses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Default address updated
     */
    router.patch('/:id/default', addressController.setDefaultAddress);
}
