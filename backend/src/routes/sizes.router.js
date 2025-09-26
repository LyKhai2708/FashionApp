const express = require('express');
const router = express.Router();
const sizesController = require('../controllers/sizes.controller');
const { methodNotAllowed } = require('../controllers/errors.controller');
module.exports.setup = (app) => {
    app.use('/api/v1/sizes', router);
    router.get('/', sizesController.getSizesByFilter);
    router.post('/', sizesController.createSize);
    router.delete('/', sizesController.deleteAllSizes);
    router.all('/', methodNotAllowed);
    router.get('/:id', sizesController.getSize);
    router.put('/:id', sizesController.updateSize);
    router.delete('/:id', sizesController.deleteSize);
    router.all('/:id', methodNotAllowed);
}