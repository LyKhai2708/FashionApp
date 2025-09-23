const express = require('express');
const productsController = require('../controllers/products.controller');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');
module.exports.setup = (app) => {
    app.use('/api/v1/products', router);
    router.get('/', productsController.getProductsByFilter);
    router.post('/', productsController.createProduct);
    router.delete('/', productsController.deleteAllProducts);
    router.all('/', methodNotAllowed);
    router.get('/:id', productsController.getProduct);
    router.put('/:id', productsController.updateProduct);
    router.delete('/:id', productsController.deleteProduct);
    router.all('/:id', methodNotAllowed);

}
