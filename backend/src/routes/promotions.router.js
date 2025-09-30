const promotionController = require('../controllers/promotions.controller');
const express = require('express');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/promotions', router);
    router.get('/', promotionController.getPromotionsbyFilter);
    router.post('/', promotionController.createPromotion);
    router.post('/:promo_id/product/:product_id', promotionController.addProductToPromotion);
    router.delete('/:promo_id/product/:product_id', promotionController.removeProductFromPromotion);
    router.get('/:promo_id/products', promotionController.getProductsInPromotion);
    router.delete('/:promo_id', promotionController.deactivatePromotion);
    router.all('/', methodNotAllowed);
    router.all('/:promo_id', methodNotAllowed);
    router.all('/:promo_id/product/:product_id', methodNotAllowed);
}