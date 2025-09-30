const promotionService = require("../services/promotions.service");
const ApiError = require("../api-error");
const JSend = require("../jsend");

async function getPromotionsbyFilter(req, res, next) {
    let result = {
        promotions: [],
        metadata: {
          totalReconds: 0,
          firstPage: 1,
          lastPage: 1,
          page: 1,
          limit: 5,
        }
      }
    try {
        result = await promotionService.getManyPromotion(req.query);
    } catch (err) {
        return next(new ApiError(500, "Error fetching promotions"));
    }
    return res.json(JSend.success({
        promotions: result.promotions,
        metadata: result.metadata
    }));
}

async function createPromotion(req, res, next) {
    if (!req.body?.promo_name || typeof req.body.promo_name !== 'string') {
        return next(new ApiError(400, 'Promotion name should be a non-empty string'));
    }
    if (!req.body?.discount_percent || typeof req.body.discount_percent !== 'number') {
        return next(new ApiError(400, 'Discount percent should be a number'));
    }
    if (!req.body?.start_date || typeof req.body.start_date !== 'string') {
        return next(new ApiError(400, 'Start date should be a string'));
    }
    if (!req.body?.end_date || typeof req.body.end_date !== 'string') {
        return next(new ApiError(400, 'End date should be a string'));
    }
    
    try {
        const promotion = await promotionService.createPromotion(req.body);
        return res.status(201).json(JSend.success({ promotion }));
    } catch (err) {
        return next(new ApiError(500, "Error creating promotion"));
    }
}

async function addProductToPromotion(req, res, next) {
    try {
        const { product_id, promo_id } = req.body;
        const result = await promotionService.addProductToPromotion(product_id, promo_id);
        return res.json(JSend.success({ result }));
    } catch (err) {
        return next(new ApiError(500, "Error adding product to promotion"));
    }
}

async function removeProductFromPromotion(req, res, next) {
    try {
        const { product_id, promo_id } = req.body;
        const result = await promotionService.removeProductFromPromotion(product_id, promo_id);
        return res.json(JSend.success({ result }));
    } catch (err) {
        return next(new ApiError(500, "Error removing product from promotion"));
    }
}


async function getProductsInPromotion(req, res, next) {
    try {
        const { promo_id } = req.params;
        const result = await promotionService.getManyProductInPromotion(promo_id);
        return res.json(JSend.success({ result }));
    } catch (err) {
        return next(new ApiError(500, "Error fetching products in promotion"));
    }
}

async function deactivatePromotion(req, res, next) {
    try {
        const { promo_id } = req.params;
        const result = await promotionService.deactivatePromotion(promo_id);
        return res.json(JSend.success({ result }));
    } catch (err) {
        return next(new ApiError(500, "Error deactivating promotion"));
    }
}


module.exports = {
    getPromotionsbyFilter,
    createPromotion,
    addProductToPromotion,
    removeProductFromPromotion,
    getProductsInPromotion,
    deactivatePromotion,
};