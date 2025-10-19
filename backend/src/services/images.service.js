const knex = require('../database/knex');
const { unlink } = require('fs');
const Paginator = require('./paginator');
function imagesRepository() {
    return knex('images');
}

async function getManyImages(query) {
    const {product_id, color_id, page = 1, limit = 5} = query;
    const paginator = new Paginator(page, limit);

    let result = await imagesRepository().where((builder) => {
        if (product_id) {
            builder.where('product_id', product_id);
        }
        if (color_id) {
            builder.where('color_id', color_id);
        }
    }).select(
        knex.raw('count(image_id) OVER() AS recordCount'),
        'image_id',
        'product_id',
        'color_id',
        'image_url'
    ).limit(paginator.limit)
    .offset(paginator.offset);

    let totalRecords = 0;
    const results = result.map((item) => {
        totalRecords = item.recordCount;
        delete item.recordCount;
        return item;
    });
    return {
        metadata: paginator.getMetadata(totalRecords),
        images: results,
    };
}

async function addImage(payload) {
    const { product_id, color_id, image_url, is_primary, display_order } = payload;
    if (!image_url) throw new Error('image_url is required');
    if (!product_id) throw new Error('product_id is required');
    if (!color_id) throw new Error('color_id is required');
    

    const productExists = await knex('products')
        .where('product_id', product_id)
        .first();
    
    if (!productExists) {
        throw new Error('Product not found');
    }

    const colorExists = await knex('colors')
        .where('color_id', color_id)
        .first();
    
    if (!colorExists) {
        throw new Error('Color not found');
    }
    
    const imageData = {
        product_id,
        color_id,
        image_url,
        is_primary: is_primary || false,
        display_order: display_order || 0
    };
    
    const [image_id] = await imagesRepository().insert(imageData);
    return { image_id, ...imageData };
}

async function removeImage(image_id) {
    const deletedImage = await imagesRepository()
    .where('image_id', image_id)
    .select('image_url')
    .first();
    if (!deletedImage) return null;
    await imagesRepository().where('image_id', image_id).del();

    if (
        deletedImage.image_url &&
        deletedImage.image_url.startsWith('/public/uploads')
    ) {
        unlink(`.${deletedImage.image_url}`, (err) => {});
    }
    return deletedImage;
}

module.exports = {
    getManyImages,
    addImage,
    removeImage,
};
