const bannerService = require('../services/banners.service');
const promotionService = require('../services/promotions.service');
const voucherService = require('../services/voucher.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');


async function getBannersbyFilter(req, res, next) {
    let result = {
        banners: [],
        metadata: {
            totalRecords: 0,
            firstPage: 1,
            lastPage: 1,
            page: 1,
            limit: 10
        }
    };
    
    try {
        const { status, banner_type, position, page, limit, start_date, end_date } = req.query;
        
        const filters = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            status,
            banner_type,
            position,
            start_date,
            end_date
        };
        
        result = await bannerService.getManyBanners(filters);
    } catch (err) {
        console.error(err);
        return next(new ApiError(500, 'Error fetching banners'));
    }
    
    return res.json(JSend.success({
        banners: result.banners,
        metadata: result.metadata
    }));
}


async function getBannerById(req, res, next) {
    try {
        const banner = await bannerService.getBannerById(req.params.id);
        return res.json(JSend.success({ banner }));
    } catch (err) {
        console.error(err);
        return next(new ApiError(404, 'Banner không tồn tại'));
    }
}


async function createBanner(req, res, next) {
    try {

        if (!req.body?.title || typeof req.body.title !== 'string') {
            return next(new ApiError(400, 'Title là bắt buộc'));
        }
        
        if (!req.body?.banner_type || !['promotion', 'voucher', 'category', 'custom'].includes(req.body.banner_type)) {
            return next(new ApiError(400, 'Banner type không hợp lệ'));
        }
        
        const payload = { ...req.body };
        
        if (req.file) {
            payload.image_url = `/public/uploads/${req.file.filename}`;
        } else {
            return next(new ApiError(400, 'Banner image là bắt buộc'));
        }
        
        if (payload.banner_type === 'promotion') {
            if (!payload.promotion_id) {
                return next(new ApiError(400, 'Promotion ID là bắt buộc cho promotion banner'));
            }
            
            if (!payload.start_date || !payload.end_date) {
                const promotion = await promotionService.getPromotionById(payload.promotion_id);
                payload.start_date = promotion.start_date;
                payload.end_date = promotion.end_date;
            }

            payload.link_url = `/promotions/${payload.promotion_id}`;
        }
        
        if (payload.banner_type === 'voucher') {
            if (!payload.voucher_id) {
                return next(new ApiError(400, 'Voucher ID là bắt buộc cho voucher banner'));
            }
            

            if (!payload.start_date || !payload.end_date) {
                const voucher = await voucherService.getVoucherById(payload.voucher_id);
                payload.start_date = voucher.start_date;
                payload.end_date = voucher.end_date;
            }
        }
        
        if (payload.banner_type === 'category') {
            if (!payload.category_id) {
                return next(new ApiError(400, 'Category ID là bắt buộc cho category banner'));
            }

            const category = await knex('categories').where('category_id', payload.category_id).first();
            if (category && category.slug) {
                payload.link_url = `/collections/${category.slug}`;
            }
        }
        
        
        const banner = await bannerService.createBanner(payload);
        
        return res.status(201).json(JSend.success({ banner }));
    } catch (err) {
        console.error(err);
        return next(new ApiError(500, err.message || 'Error creating banner'));
    }
}


async function updateBanner(req, res, next) {
    try {
        const payload = { ...req.body };
        
        if (req.file) {
            payload.image_url = `/public/uploads/${req.file.filename}`;
        }
        
        if (payload.banner_type && !['promotion', 'voucher', 'category', 'custom'].includes(payload.banner_type)) {
            return next(new ApiError(400, 'Banner type không hợp lệ'));
        }

        if (payload.banner_type === 'promotion' && payload.promotion_id) {
         payload.link_url = `/promotions/${payload.promotion_id}`;
        }

        if (payload.banner_type === 'category' && payload.category_id) {
            const category = await knex('categories').where('category_id', payload.category_id).first();
            if (category && category.slug) {
                payload.link_url = `/collections/${category.slug}`;
            }
        }
        
        const updated = await bannerService.updateBanner(req.params.id, payload);
        
        return res.json(JSend.success({ banner: updated }));
    } catch (err) {
        console.error(err);
        return next(new ApiError(500, err.message || 'Error updating banner'));
    }
}

async function deleteBanner(req, res, next) {
    try {
        const deleted = await bannerService.deleteBanner(req.params.id);
        return res.json(JSend.success({ banner: deleted }));
    } catch (err) {
        console.error(err);
        return next(new ApiError(500, 'Error deleting banner'));
    }
}


async function getActiveBanners(req, res, next) {
    try {
        const { position = 'home-hero' } = req.query;
        const banners = await bannerService.getActiveBanners(position);
        return res.json(JSend.success({ banners }));
    } catch (err) {
        console.error(err);
        return next(new ApiError(500, 'Error fetching active banners'));
    }
}

module.exports = {
    getBannersbyFilter,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    getActiveBanners
};
