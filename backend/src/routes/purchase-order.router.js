const express = require('express');
const purchaseOrderController = require('../controllers/purchase-order.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

const router = express.Router();

function setup(app) {
    app.use('/api/v1/purchase-orders', router);

    router.use(authMiddleware);
    router.use(checkPermission);

    router.get('/', purchaseOrderController.getPurchaseOrders);
    router.get('/:id', purchaseOrderController.getPurchaseOrderById);
    router.post('/', purchaseOrderController.createPurchaseOrder);
    router.patch('/:id/status', purchaseOrderController.updateStatus);
    router.delete('/:id', purchaseOrderController.deletePurchaseOrder);
}

module.exports = { setup };
