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
        const { active, page, limit, promo_name, start_date, end_date } = req.query;
        
        const filters = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            promo_name,
            start_date,
            end_date
        };
        
        if (active !== undefined) {
            filters.active = active === 'true' || active === true;
        }
        
        result = await promotionService.getManyPromotion(filters);
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error fetching promotions"));
    }
    return res.json(JSend.success({
        promotions: result.promotions,
        metadata: result.metadata
    }));
}

async function createPromotion(req, res, next) {
    if (!req.body?.name || typeof req.body.name !== 'string') {
        return next(new ApiError(400, 'Promotion name should be a non-empty string'));
    }
    if (!req.body?.discount_percent || typeof req.body.discount_percent !== 'number') {
        return next(new ApiError(400, 'Discount percent should be a number'));
    }
    if (req.body.discount_percent < 0 || req.body.discount_percent > 100) {
        return next(new ApiError(400, 'Discount percent should be between 0 and 100'));
    }
    if (!req.body?.start_date || typeof req.body.start_date !== 'string') {
        return next(new ApiError(400, 'Start date should be a string'));
    }
    if (!req.body?.end_date || typeof req.body.end_date !== 'string') {
        return next(new ApiError(400, 'End date should be a string'));
    }

    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime())) {
        return next(new ApiError(400, 'Start date is not a valid date'));
    }
    if (isNaN(endDate.getTime())) {
        return next(new ApiError(400, 'End date is not a valid date'));
    }
    if (startDate < today) {
        return next(new ApiError(400, 'Start date cannot be in the past'));
    }
    if (endDate < today) {
        return next(new ApiError(400, 'End date cannot be in the past'));
    }
    if (startDate >= endDate) {
        return next(new ApiError(400, 'Start date must be before end date'));
    }
    
    try {
        const promotion = await promotionService.createPromotion(req.body);
        return res.status(201).json(JSend.success({ promotion }));
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error creating promotion"));
    }
}

async function addProductToPromotion(req, res, next) {
    try {
        const { product_id, promo_id } = req.params;
        const result = await promotionService.addProductToPromotion(product_id, promo_id);
        return res.json(JSend.success({ result }));
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error adding product to promotion"));
    }
}

async function removeProductFromPromotion(req, res, next) {
    try {
        const { product_id, promo_id } = req.params;
        const result = await promotionService.removeProductFromPromotion(product_id, promo_id);
        return res.json(JSend.success({ result }));
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error removing product from promotion"));
    }
}

async function getProductsInPromotion(req, res, next) {
    try {
        const { promo_id } = req.params;
        const { page, limit } = req.query;
        const role = req.user?.role || null;
        
        const result = await promotionService.getManyProductInPromotion({
            promo_id: parseInt(promo_id),
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10
        }, role);
        return res.json(JSend.success({ 
            products: result.products,
            metadata: result.metadata 
        }));
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error fetching products in promotion"));
    }
}

async function deactivatePromotion(req, res, next) {
    try {
        const { promo_id } = req.params;
        const result = await promotionService.deactivatePromotion(promo_id);
        return res.json(JSend.success({ result }));
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error deactivating promotion"));
    }
}

async function getPromotionById(req, res, next) {
    try {
        const { promo_id } = req.params;
        const promotion = await promotionService.getPromotionById(parseInt(promo_id));
        return res.json(JSend.success({ promotion }));
    } catch (err) {
        console.log(err);
        if (err.message === 'Promotion không tồn tại') {
            return next(new ApiError(404, err.message));
        }
        return next(new ApiError(500, "Error fetching promotion"));
    }
}


module.exports = {
    getPromotionsbyFilter,
    createPromotion,
    addProductToPromotion,
    removeProductFromPromotion,
    getProductsInPromotion,
    deactivatePromotion,
    getPromotionById,
};