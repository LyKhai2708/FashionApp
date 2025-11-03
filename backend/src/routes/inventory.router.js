const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/inventory', router);
    
    router.use(authMiddleware);
    router.use(authorizeRoles('admin'));
    
    router.get('/overview', inventoryController.getInventoryOverview);
    router.all('/overview', methodNotAllowed);
    
    router.get('/low-stock', inventoryController.getLowStockProducts);
    router.all('/low-stock', methodNotAllowed);
    
    router.post('/adjust/:variantId', inventoryController.adjustStock);
    router.all('/adjust/:variantId', methodNotAllowed);
    
    router.get('/history', inventoryController.getStockHistory);
    router.all('/history', methodNotAllowed);
    
    router.get('/trend', inventoryController.getStockTrend);
    router.all('/trend', methodNotAllowed);
};
