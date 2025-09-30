const express = require('express');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');
const categoryController = require('../controllers/categories.controller');
const {authMiddleware, authorizeRoles} = require('../middleware/auth.middleware');
module.exports.setup = (app) => {
    app.use('/api/v1/categories', router);
    router.get('/', categoryController.getCategoriesbyFilter);
    router.post('/',authMiddleware,authorizeRoles('admin'), categoryController.createCategory);
    router.delete('/',authMiddleware,authorizeRoles('admin'), categoryController.deleteAllCategories);
    router.all('/', methodNotAllowed);
    router.put('/:category_id',authMiddleware,authorizeRoles('admin'), categoryController.updateCategory);
    router.delete('/:category_id',authMiddleware,authorizeRoles('admin'), categoryController.deleteCategory);
    router.get('/:category_id', categoryController.getCategory);
    router.all('/:category_id', methodNotAllowed);
}