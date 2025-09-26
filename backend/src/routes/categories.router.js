const express = require('express');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');
const categoryController = require('../controllers/categories.controller');
module.exports.setup = (app) => {
    app.use('/api/v1/categories', router);
    router.get('/', categoryController.getCategoriesbyFilter);
    router.post('/', categoryController.createCategory);
    router.delete('/', categoryController.deleteAllCategories);
    router.all('/', methodNotAllowed);
    router.put('/:category_id', categoryController.updateCategory);
    router.delete('/:category_id', categoryController.deleteCategory);
    router.get('/:category_id', categoryController.getCategory);
    router.all('/:category_id', methodNotAllowed);
}