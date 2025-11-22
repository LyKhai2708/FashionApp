const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/inventory', router);

    router.use(authMiddleware);

    router.get('/overview', checkPermission, inventoryController.getInventoryOverview);
    router.all('/overview', methodNotAllowed);

    router.get('/low-stock', checkPermission, inventoryController.getLowStockProducts);
    router.all('/low-stock', methodNotAllowed);

    router.post('/adjust/:variantId', checkPermission, inventoryController.adjustStock);
    router.all('/adjust/:variantId', methodNotAllowed);

    router.get('/history', checkPermission, inventoryController.getStockHistory);
    router.all('/history', methodNotAllowed);

    router.get('/trend', checkPermission, inventoryController.getStockTrend);
    router.all('/trend', methodNotAllowed);
};
