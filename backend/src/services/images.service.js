const knex = require('../database/knex');
const { unlink } = require('fs');
const Paginator = require('./paginator');
function imagesRepository() {
    return knex('images');
}

async function getManyImages(query) {
    const {product_color_id, page = 1, limit = 5} = query;
    const paginator = new Paginator(page, limit);

    let result = await imagesRepository().where((builder) => {
        if (product_color_id) {
            builder.where('product_color_id', product_color_id);
        }
    }).select(
        knex.raw('count(image_id) OVER() AS recordCount'),
        'image_id',
        'product_color_id',
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
    const { product_color_id, image_url } = payload;
    if (!image_url) throw new Error('image_url is required');
    if (!product_color_id) throw new Error('product_color_id is required');
    
    // Verify product_color exists
    const productColorExists = await knex('product_colors')
        .where('product_color_id', product_color_id)
        .first();
    
    if (!productColorExists) {
        throw new Error('Product color not found');
    }
    
    const [image_id] = await imagesRepository().insert({ product_color_id, image_url });
    return { image_id, product_color_id, image_url };
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
