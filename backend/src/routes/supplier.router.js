const express = require('express');
const supplierController = require('../controllers/supplier.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

const router = express.Router();

function setup(app) {
    app.use('/api/v1/suppliers', router);

    router.use(authMiddleware);
    router.use(checkPermission);

    router.get('/', supplierController.getSuppliers);
    router.get('/:id', supplierController.getSupplierById);
    router.post('/', supplierController.createSupplier);
    router.put('/:id', supplierController.updateSupplier);
    router.delete('/:id', supplierController.deleteSupplier);
}

module.exports = { setup };
