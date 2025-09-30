const express = require('express');
const router = express.Router();
const favouriteController = require('../controllers/favourite.controller');

module.exports.setup = (app) => {
    router.get('/', favouriteController.getFavorites);
    router.delete('/:user_id/:product_id', favouriteController.deleteFavorite);
    router.post('/:user_id/:product_id', favouriteController.addFavorite);
    app.use('/api/v1/favorites', router);
}
