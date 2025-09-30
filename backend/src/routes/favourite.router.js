const express = require('express');
const router = express.Router();
const favouriteController = require('../controllers/favourite.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/favorites', router);
    
    // Tất cả routes cần authentication
    router.use(authMiddleware);
    
    router.get('/', favouriteController.getFavorites);
    router.delete('/:user_id/:product_id', favouriteController.deleteFavorite);
    router.post('/:user_id/:product_id', favouriteController.addFavorite);
    router.all('/', methodNotAllowed);
    router.all('/:user_id/:product_id', methodNotAllowed);
}
