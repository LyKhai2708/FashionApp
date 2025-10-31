const knex = require('../database/knex');
const Paginator = require('./paginator');
const { unlink } = require('fs').promises;

function bannerRepository() {
    return knex('banners');
}

function readBanner(payload) {
    const banner = {
        title: payload.title,
        alt_text: payload.alt_text || null,
        image_url: payload.image_url,
        banner_type: payload.banner_type,
        promotion_id: payload.promotion_id || null,
        voucher_id: payload.voucher_id || null,
        category_id: payload.category_id || null,
        link_url: payload.link_url || null,
        link_target: payload.link_target || '_self',
        start_date: payload.start_date || null,
        end_date: payload.end_date || null,
        status: payload.status || 'draft',
        position: payload.position || 'home-hero',
        display_order: payload.display_order || 0
    };
    
    return banner;
}

/**
 * Tạo banner mới
 */
async function createBanner(payload) {
    const banner = readBanner(payload);
    const [id] = await bannerRepository().insert(banner);
    return { banner_id: id, ...banner };
}


async function getManyBanners(payload) {
    const { 
        page = 1, 
        limit = 10, 
        status, 
        banner_type, 
        position,
        start_date,
        end_date
    } = payload;
    
    const paginator = new Paginator(page, limit);
    
    let query = bannerRepository()
        .leftJoin('promotions', 'banners.promotion_id', 'promotions.promo_id')
        .leftJoin('vouchers', 'banners.voucher_id', 'vouchers.voucher_id')
        .leftJoin('categories', 'banners.category_id', 'categories.category_id')
        .where((builder) => {
            if (status) {
                builder.where('banners.status', status);
            }
            if (banner_type) {
                builder.where('banner_type', banner_type);
            }
            if (position) {
                builder.where('position', position);
            }
            if (start_date) {
                builder.where('banners.start_date', '>=', start_date);
            }
            if (end_date) {
                builder.where('banners.end_date', '<=', end_date);
            }
        })
        .select(
            knex.raw('count(banners.banner_id) OVER() AS recordCount'),
            'banners.*',
            'promotions.name as promotion_name',
            'promotions.discount_percent',
            'vouchers.code as voucher_code',
            'vouchers.name as voucher_name',
            'categories.category_name'
        )
        .orderBy('banners.display_order', 'asc')
        .orderBy('banners.created_at', 'desc')
        .limit(paginator.limit)
        .offset(paginator.offset);
    
    const result = await query;
    
    let totalRecords = 0;
    const banners = result.map((banner) => {
        totalRecords = banner.recordCount;
        delete banner.recordCount;
        return banner;
    });
    
    return {
        metadata: paginator.getMetadata(totalRecords),
        banners
    };
}

/**
 * Lấy banner theo ID
 */
async function getBannerById(bannerId) {
    const banner = await bannerRepository()
        .leftJoin('promotions', 'banners.promotion_id', 'promotions.promo_id')
        .leftJoin('vouchers', 'banners.voucher_id', 'vouchers.voucher_id')
        .leftJoin('categories', 'banners.category_id', 'categories.category_id')
        .where('banners.banner_id', bannerId)
        .select(
            'banners.*',
            'promotions.name as promotion_name',
            'promotions.start_date as promotion_start_date',
            'promotions.end_date as promotion_end_date',
            'vouchers.code as voucher_code',
            'vouchers.name as voucher_name',
            'vouchers.start_date as voucher_start_date',
            'vouchers.end_date as voucher_end_date',
            'categories.category_name',
            'categories.slug as category_slug'
        )
        .first();
    
    if (!banner) {
        throw new Error('Banner không tồn tại');
    }
    
    return banner;
}

/**
 * Cập nhật banner
 */
async function updateBanner(bannerId, payload) {
    const existingBanner = await getBannerById(bannerId);
    
    const banner = readBanner(payload);
    
    if (existingBanner.image_url && banner.image_url && 
        banner.image_url !== existingBanner.image_url) {
        const oldImagePath = existingBanner.image_url.startsWith('/public/uploads/')
            ? `.${existingBanner.image_url}`
            : `./public${existingBanner.image_url}`;
        try {
            await unlink(oldImagePath);
            console.log('Deleted old banner image:', oldImagePath);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error('Failed to delete old banner image:', err.message);
            }
        }
    }
    
    await bannerRepository()
        .where('banner_id', bannerId)
        .update({
            ...banner,
            updated_at: knex.fn.now()
        });
    
    return await getBannerById(bannerId);
}


async function deleteBanner(bannerId) {
    const banner = await getBannerById(bannerId);
    
    await bannerRepository()
        .where('banner_id', bannerId)
        .update({
            status: 'expired',
            updated_at: knex.fn.now()
        });
    
    return banner;
}


async function getActiveBanners(position = 'home-hero') {
    const today = new Date().toISOString().split('T')[0];
    
    const banners = await bannerRepository()
        .leftJoin('promotions', 'banners.promotion_id', 'promotions.promo_id')
        .leftJoin('vouchers', 'banners.voucher_id', 'vouchers.voucher_id')
        .leftJoin('categories', 'banners.category_id', 'categories.category_id')
        .where('banners.status', 'active')
        .where('banners.position', position)
        .where(function() {
            this.whereNull('banners.start_date')
                .orWhere('banners.start_date', '<=', today);
        })
        .where(function() {
            this.whereNull('banners.end_date')
                .orWhere('banners.end_date', '>=', today);
        })
        .select(
            'banners.*',
            'promotions.name as promotion_name',
            'promotions.promo_id',
            'vouchers.code as voucher_code',
            'categories.slug as category_slug'
        )
        .orderBy('banners.display_order', 'asc')
        .orderBy('banners.created_at', 'desc');
    
    return banners;
}

module.exports = {
    createBanner,
    getManyBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
    getActiveBanners
};
