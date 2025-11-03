const knex = require('../database/knex');
const slugify = require('./slugify');
const Paginator = require('./paginator');
const { unlink } = require('fs').promises;

async function getAllChildCategoryIds(parentCategoryId) {
    const childCategories = await knex('categories')
        .where('parent_id', parentCategoryId)
        .select('category_id');
    
    let allChildIds = [parentCategoryId]; 
    
    for (const child of childCategories) {
        const grandChildIds = await getAllChildCategoryIds(child.category_id);
        allChildIds = allChildIds.concat(grandChildIds);
    }
    
    return allChildIds;
}

function productsRepository() {
    return knex('products');
}

function readProduct(payload) {
    
    const product = {
        name: payload.name,
        description: payload.description || null,
        brand_id: payload.brand_id,
        base_price: payload.base_price,
        thumbnail: payload.thumbnail || null,
        category_id: payload.category_id,
        del_flag: payload.del_flag ?? 0,
    };
    if (payload.slug && payload.slug.trim() !== "") {
        product.slug = payload.slug;
    } else if (payload.name) {
        product.slug = slugify(payload.name);
    }
    return product;
}
function variantRepository() {
    return knex('variants');
}


function imageRepository() {
    return knex('images');
}



async function createProduct(payload) {
    return await knex.transaction(async (trx) => {
        const product = readProduct(payload);
        const [product_id] = await trx("products").insert(product);
        
        if (payload.variants && payload.variants.length > 0) {
            const variantInserts = payload.variants.map(variant => ({
                product_id: product_id,
                color_id: variant.color_id,
                size_id: variant.size_id,
                stock_quantity: variant.stock_quantity || 0,
                active: variant.active !== undefined ? variant.active : 1
            }));
            
            await trx("product_variants").insert(variantInserts);
        }
        
        if (payload.variants && payload.variants.length > 0) {
            const imagesByColor = new Map();
            
            payload.variants.forEach(variant => {
                if (variant.images && variant.images.length > 0) {
                    if (!imagesByColor.has(variant.color_id)) {
                        imagesByColor.set(variant.color_id, variant.images);
                    }
                }
            });
            
            for (const [color_id, images] of imagesByColor) {
                const imageInserts = images.map((image, index) => {
                    const imageUrl = typeof image === 'string' ? image : (image.url || image.image_url);
                    const isPrimary = typeof image === 'object' ? (image.is_primary || index === 0) : (index === 0);
                    const displayOrder = typeof image === 'object' ? (image.display_order || index + 1) : (index + 1);
                    
                    return {
                        product_id: product_id,
                        color_id: color_id,
                        image_url: imageUrl,
                        is_primary: isPrimary,
                        display_order: displayOrder
                    };
                });
                
                await trx("images").insert(imageInserts);
            }
        }
        
        return { 
            ...product, 
            product_id,
            variants_added: payload.variants?.length || 0
        };
    });
}

async function getProductById(id, user_id = null) {
    try {
        const promotionSubquery = knex.raw(
            `(SELECT pp.product_id, p.discount_percent, p.name as promo_name, p.promo_id
            FROM promotion_products pp
            JOIN promotions p ON pp.promo_id = p.promo_id
            WHERE p.active = TRUE
            AND p.start_date <= CURDATE()
            AND p.end_date >= CURDATE()) AS active_promotions`
        );

        let query = knex('products as p')
            .leftJoin('brand as b', 'p.brand_id', 'b.id')
            .leftJoin('categories as c', 'p.category_id', 'c.category_id')
            .leftJoin(promotionSubquery, 'p.product_id', 'active_promotions.product_id')
            .leftJoin('favorites as f', function() {
                this.on('p.product_id', '=', 'f.product_id');
                if (user_id) {
                    this.andOn('f.user_id', '=', knex.raw('?', [user_id]));
                } else {
                    this.andOn(knex.raw('1'), '=', knex.raw('0'));
                }
            });

        const product = await query
            .where('p.product_id', id)
            .where('p.del_flag', 0)
            .select(
                'p.*',
                'b.name as brand_name',
                'c.category_name',
                'active_promotions.discount_percent',
                'active_promotions.promo_name',
                'active_promotions.promo_id',
                knex.raw(`
                    CASE 
                        WHEN active_promotions.discount_percent IS NOT NULL 
                        THEN ROUND(p.base_price * (1 - active_promotions.discount_percent / 100), 2)
                        ELSE p.base_price 
                    END as discounted_price
                `),
                knex.raw(`
                    CASE 
                        WHEN active_promotions.discount_percent IS NOT NULL 
                        THEN true 
                        ELSE false 
                    END as has_promotion
                `),
                knex.raw(`
                    CASE 
                        WHEN f.favorite_id IS NOT NULL 
                        THEN true 
                        ELSE false 
                    END as is_favorite
                `),
                'f.favorite_id'
            )
            .first();

        if (!product) {
            console.log(`Product with id ${id} not found`);
            return null;
        }

        const variants = await knex('product_variants as pv')
            .join('colors as c', 'pv.color_id', 'c.color_id')
            .join('sizes as s', 'pv.size_id', 's.size_id')
            .where('pv.product_id', id)
            .select(
                'pv.product_variants_id as variant_id',
                'pv.product_id',
                'pv.color_id',
                'c.name as color_name',
                'c.hex_code as color_hex',
                'pv.size_id', 
                's.name as size_name',
                'pv.stock_quantity',
                'pv.active'
            )
            .orderBy('c.name')
            .orderBy('s.name');


        const colorIds = variants.length > 0 ? [...new Set(variants.map(v => v.color_id))] : [];
        const images = colorIds.length > 0 ? await knex('images')
            .where('product_id', id)
            .whereIn('color_id', colorIds)
            .select(
                'color_id',
                'image_url', 
                'is_primary', 
                'display_order'
            )
            .orderBy('display_order') : [];

        const imagesByColor = {};
        for (const img of images) {
            if (!imagesByColor[img.color_id]) {
                imagesByColor[img.color_id] = [];
            }
            imagesByColor[img.color_id].push({
                image_url: img.image_url || '',
                is_primary: Boolean(img.is_primary),
                display_order: img.display_order || 0
            });
        }

        const formattedVariants = variants.map(variant => ({
            variant_id: variant.variant_id,
            color: {
                color_id: variant.color_id,
                name: variant.color_name,
                hex_code: variant.color_hex,
                images: imagesByColor[variant.color_id] || []
            },
            size: {
                size_id: variant.size_id,
                name: variant.size_name
            },
            stock_quantity: variant.stock_quantity,
            final_price: (function() {
                const baseOrDiscounted = parseFloat(product.discounted_price ?? product.base_price);
                return parseFloat((baseOrDiscounted).toFixed(2));
            })(),
            active: variant.active
        }));

        const reviewStats = await knex('product_reviews')
            .where('product_id', id)
            .select(knex.raw('COUNT(*) as review_count'))
            .select(knex.raw('AVG(rating) as average_rating'))
            .first();

        return {
            ...product,
            variants: formattedVariants,
            price_info: {
                base_price: parseFloat(product.base_price),
                discounted_price: parseFloat(product.discounted_price),
                discount_percent: product.discount_percent,
                has_promotion: product.has_promotion
            },
            review_count: reviewStats ? parseInt(reviewStats.review_count) || 0 : 0,
            average_rating: reviewStats ? parseFloat(reviewStats.average_rating) || 0 : 0
        };
    } catch (error) {
        console.error('Error in getProductById:', error);
        throw error;
    }
}
  
async function updateProduct(id, payload) {
    return await knex.transaction(async (trx) => {
        const updatedProduct = await trx('products').where("product_id", id).select('*').first();
        if (!updatedProduct) return null;

        const update = readProduct(payload);
        const { imageData } = payload;

        if (imageData && imageData.newThumbnail && imageData.uploadedFiles.length > 0) {
            update.thumbnail = `/public/uploads/${imageData.uploadedFiles[0].filename}`;
            
            if (updatedProduct.thumbnail && update.thumbnail !== updatedProduct.thumbnail) {
                const oldFilePath = updatedProduct.thumbnail.startsWith('/public/uploads/')
                    ? `.${updatedProduct.thumbnail}`
                    : `./public${updatedProduct.thumbnail}`;
                try {
                    await unlink(oldFilePath);
                    console.log('Deleted old thumbnail:', oldFilePath);
                } catch (err) {
                    if (err.code !== 'ENOENT') {
                        console.error('Failed to delete old thumbnail:', oldFilePath, err.message);
                    }
                }
            }
        } else {
            delete update.thumbnail;
        }

        await trx('products').where("product_id", id).update(update);

        if (payload.variants) {
            const variants = typeof payload.variants === 'string' 
                ? JSON.parse(payload.variants) 
                : payload.variants;

            if (variants && variants.length > 0) {
                const existingVariants = await trx('product_variants')
                    .where('product_id', id)
                    .select('*');

                const existingVariantMap = new Map(
                    existingVariants.map(v => [`${v.color_id}-${v.size_id}`, v])
                );

                const newVariantKeys = new Set();

                for (const variant of variants) {
                    const key = `${variant.color_id}-${variant.size_id}`;
                    newVariantKeys.add(key);

                    const existing = existingVariantMap.get(key);

                    if (existing) {
                        await trx('product_variants')
                            .where('product_variants_id', existing.product_variants_id)
                            .update({
                                active: variant.active !== undefined ? variant.active : 1
                            });
                    } else {
                        await trx('product_variants').insert({
                            product_id: id,
                            color_id: variant.color_id,
                            size_id: variant.size_id,
                            stock_quantity: variant.stock_quantity || 0,
                            active: variant.active !== undefined ? variant.active : 1
                        });
                    }
                }

                for (const [key, existing] of existingVariantMap) {
                    if (!newVariantKeys.has(key)) {
                        await trx('product_variants')
                            .where('product_variants_id', existing.product_variants_id)
                            .update({ active: 0 });
                    }
                }
            }
        }

        if (imageData) {
            if (imageData.deletedImages && imageData.deletedImages.length > 0) {
                for (const imageUrl of imageData.deletedImages) {
                    const deletedImage = await trx('images')
                        .where({ product_id: id, image_url: imageUrl })
                        .first();
                    
                    await trx('images').where({
                        product_id: id,
                        image_url: imageUrl
                    }).delete();

                    const filePath = imageUrl.startsWith('/public/uploads/')
                        ? `.${imageUrl}`
                        : `./public${imageUrl}`;
                    try {
                        await unlink(filePath);
                        console.log('Deleted image:', filePath);
                    } catch (err) {
                        if (err.code !== 'ENOENT') {
                            console.error('Failed to delete image file:', filePath, err.message);
                        }
                    }
                    
                    // If deleted image was primary, set first remaining image as primary
                    if (deletedImage && deletedImage.is_primary) {
                        const firstRemaining = await trx('images')
                            .where({
                                product_id: id,
                                color_id: deletedImage.color_id
                            })
                            .orderBy('display_order', 'asc')
                            .first();
                        
                        if (firstRemaining) {
                            await trx('images')
                                .where('image_id', firstRemaining.image_id)
                                .update({ is_primary: true });
                        }
                    }
                }
            }

            if (imageData.updatedImages && imageData.updatedImages.length > 0) {
                for (const img of imageData.updatedImages) {
                    await trx('images').where({
                        product_id: id,
                        image_url: img.image_url
                    }).update({
                        is_primary: img.is_primary || false,
                        display_order: img.display_order || 1
                    });
                }
            }

            let fileIndex = imageData.newThumbnail ? 1 : 0;
            if (imageData.uploadedFiles && imageData.uploadedFiles.length > fileIndex) {
                for (let i = fileIndex; i < imageData.uploadedFiles.length; i++) {
                    const file = imageData.uploadedFiles[i];
                    const colorId = imageData.imageColors[i - fileIndex];
                    
                    if (colorId) {
                        const maxOrder = await trx('images')
                            .where({ product_id: id, color_id: colorId })
                            .max('display_order as max')
                            .first();
                        
                        await trx('images').insert({
                            product_id: id,
                            color_id: colorId,
                            image_url: `/public/uploads/${file.filename}`,
                            is_primary: false,
                            display_order: (maxOrder.max || 0) + 1
                        });
                    }
                }
            }
        }

        return { ...updatedProduct, ...update };
    });
}


  
async function getManyProducts(query, role = null) {
    const { search, brand_id, category_id, category_slug, del_flag, min_price, max_price, color_id, size_id, page = 1, limit = 10, sort, user_id } = query;

    const paginator = new Paginator(page, limit);
    
    let categoryIds = null;
    if (category_id) {
        categoryIds = await getAllChildCategoryIds(category_id);
    } else if (category_slug) {
        const category = await knex('categories')
            .where('slug', category_slug)
            .first();
        if (category) {
            categoryIds = await getAllChildCategoryIds(category.category_id);
        }
    }

    function applyFilters(builder) {
        if (search) builder.where('p.name', 'like', `%${search}%`);
        if (brand_id) builder.where('p.brand_id', brand_id);
        if (categoryIds) {
            builder.whereIn('p.category_id', categoryIds);
        }
        if (del_flag !== undefined) {
            builder.where('p.del_flag', del_flag == '1' || del_flag == 'true' ? 1 : 0);
        } else if(del_flag === undefined && role !== 'admin') {
            builder.where('p.del_flag', 0);
        } else if( del_flag === undefined && role === 'admin'){
        }
        if (min_price) {
            builder.whereRaw(`
                CASE 
                    WHEN active_promotions.discount_percent IS NOT NULL 
                    THEN ROUND(p.base_price * (1 - active_promotions.discount_percent / 100), 2)
                    ELSE p.base_price 
                END >= ?
            `, [min_price]);
        }
        if (max_price) {
            builder.whereRaw(`
                CASE 
                    WHEN active_promotions.discount_percent IS NOT NULL 
                    THEN ROUND(p.base_price * (1 - active_promotions.discount_percent / 100), 2)
                    ELSE p.base_price 
                END <= ?
            `, [max_price]);
        }
        if (color_id) {
            const colorIds = color_id.toString().split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            if (colorIds.length > 0) {
                builder.whereIn('pv.color_id', colorIds);
            }
        }
        if (size_id) {
            const sizeIds = size_id.toString().split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            if (sizeIds.length > 0) {
                builder.whereIn('pv.size_id', sizeIds);
            }
        }
    }

    function buildBaseQuery() {
        const promotionSubquery = knex.raw(
            `(SELECT pp.product_id, p.discount_percent
            FROM promotion_products pp
            JOIN promotions p ON pp.promo_id = p.promo_id
            WHERE p.active = TRUE
            AND p.start_date <= CURDATE()
            AND p.end_date >= CURDATE()) AS active_promotions`
        );

        let query = knex('products as p')
            .leftJoin('brand as b', 'p.brand_id', 'b.id')
            .leftJoin('categories as c', 'p.category_id', 'c.category_id')
            .leftJoin(promotionSubquery, 'p.product_id', 'active_promotions.product_id');
            
        if (user_id) {
            query = query.leftJoin('favorites as f', function() {
                this.on('p.product_id', '=', 'f.product_id')
                    .andOn('f.user_id', '=', knex.raw('?', [user_id]));
            });
        } else {
            query = query.leftJoin('favorites as f', function() {
                this.on('p.product_id', '=', 'f.product_id')
                    .andOn(knex.raw('1'), '=', knex.raw('0'));
            });
        }
            
        if (color_id || size_id) {
            query = query.join('product_variants as pv', 'p.product_id', 'pv.product_id');
        }
        

        return query;
    }

    let productsQuery = buildBaseQuery()
        .where(applyFilters)
        .select(
            'p.product_id',
            'p.name',
            'p.description',
            'p.slug',
            'p.base_price',
            'p.thumbnail',
            'p.brand_id',
            'p.category_id',
            'p.created_at',
            'p.del_flag',
            'p.sold',
            'b.name as brand_name',
            'c.category_name',
            'active_promotions.discount_percent',
            knex.raw(`
                CASE 
                    WHEN active_promotions.discount_percent IS NOT NULL 
                    THEN ROUND(p.base_price * (1 - active_promotions.discount_percent / 100), 2)
                    ELSE p.base_price 
                END as discounted_price
            `),
            knex.raw(`
                CASE 
                    WHEN active_promotions.discount_percent IS NOT NULL 
                    THEN true 
                    ELSE false 
                END as has_promotion
            `),
            knex.raw(`
                CASE 
                    WHEN f.favorite_id IS NOT NULL 
                    THEN true 
                    ELSE false 
                END as is_favorite
            `),
            'f.favorite_id',
            knex.raw(`(
                SELECT COALESCE(SUM(pv.stock_quantity), 0)
                FROM product_variants pv
                WHERE pv.product_id = p.product_id
            ) as total_stock`)
                        
        )
        .distinct('p.product_id')
        .limit(paginator.limit)
        .offset(paginator.offset);
    switch (sort) {
        case 'price_asc':
            productsQuery = productsQuery.orderByRaw(`CASE WHEN active_promotions.discount_percent IS NOT NULL THEN ROUND(p.base_price * (1 - active_promotions.discount_percent / 100), 2) ELSE p.base_price END ASC`);
            break;
        case 'price_desc':
            productsQuery = productsQuery.orderByRaw(`CASE WHEN active_promotions.discount_percent IS NOT NULL THEN ROUND(p.base_price * (1 - active_promotions.discount_percent / 100), 2) ELSE p.base_price END DESC`);
            break;
        case 'sold':
            productsQuery = productsQuery.orderBy('p.sold', 'desc');
            break;
        case 'newest':
        default:
            productsQuery = productsQuery.orderBy('p.created_at', 'desc');
    }

    const [{ total }] = await buildBaseQuery()
        .where(applyFilters)
        .countDistinct('p.product_id as total');

    const result = await productsQuery;
    const products = result;

    if (products.length > 0) {
        const productIds = products.map(p => p.product_id);
        
        const colors = await knex('product_variants as pv')
            .join('colors as c', 'pv.color_id', 'c.color_id')
            .whereIn('pv.product_id', productIds)
            .select('pv.product_id', 'c.color_id', 'c.name as color_name', 'c.hex_code')
            .groupBy('pv.product_id', 'c.color_id', 'c.name', 'c.hex_code')
            .orderBy('c.color_id');

        const images = await knex('images')
            .whereIn('product_id', productIds)
            .select('product_id', 'color_id', 'image_url', 'is_primary', 'display_order')
            .orderBy('display_order');


        const imagesByProductAndColor = {};
        for (const img of images) {
            const key = `${img.product_id}_${img.color_id}`;
            if (!imagesByProductAndColor[key]) {
                imagesByProductAndColor[key] = [];
            }
            imagesByProductAndColor[key].push({
                image_url: img.image_url,
                is_primary: img.is_primary,
                display_order: img.display_order
            });
        }

        const colorsByProduct = {};
        for (const color of colors) {
            if (!colorsByProduct[color.product_id]) {
                colorsByProduct[color.product_id] = [];
            }
            const key = `${color.product_id}_${color.color_id}`;
            colorsByProduct[color.product_id].push({
                color_id: color.color_id,
                name: color.color_name,
                hex_code: color.hex_code,
                images: imagesByProductAndColor[key] || []
            });
        }

        let queryVariant = knex('product_variants as pv')
            .join('sizes as s', 'pv.size_id', 's.size_id')
            .whereIn('pv.product_id', productIds)
            .select(
                'pv.product_variants_id as variant_id',
                'pv.product_id',
                'pv.color_id',
                'pv.size_id',
                's.name as size_name',
                'pv.stock_quantity',
            )
            .orderBy('s.size_id');
        if (role === 'admin') {
        } else {
            queryVariant.where('pv.active', '=', 1);
        }
        const variants = await queryVariant;
        

        const variantsByProductAndColor = {};
        for (const variant of variants) {
            const key = `${variant.product_id}_${variant.color_id}`;
            if (!variantsByProductAndColor[key]) {
                variantsByProductAndColor[key] = [];
            }
            variantsByProductAndColor[key].push({
                variant_id: variant.variant_id,
                size_id: variant.size_id,
                size_name: variant.size_name,
                stock_quantity: variant.stock_quantity
            });
        }

        for (const productId in colorsByProduct) {
            for (const color of colorsByProduct[productId]) {
                const key = `${productId}_${color.color_id}`;
                color.sizes = variantsByProductAndColor[key] || [];
            }
        }

        const reviewsStats = await knex('product_reviews')
            .whereIn('product_id', productIds)
            .select('product_id')
            .select(knex.raw('COUNT(*) as review_count'))
            .select(knex.raw('AVG(rating) as average_rating'))
            .groupBy('product_id');

        const reviewsByProduct = {};
        for (const stat of reviewsStats) {
            reviewsByProduct[stat.product_id] = {
                review_count: parseInt(stat.review_count) || 0,
                average_rating: parseFloat(stat.average_rating) || 0
            };
        }

        for (const product of products) {
            product.colors = colorsByProduct[product.product_id] || [];
            product.price_info = {
                base_price: parseFloat(product.base_price),
                discounted_price: parseFloat(product.discounted_price),
                discount_percent: product.discount_percent || 0,
                has_promotion: product.has_promotion
            };
            
            const reviews = reviewsByProduct[product.product_id];
            product.review_count = reviews ? reviews.review_count : 0;
            product.average_rating = reviews ? reviews.average_rating : 0;
        }
    }

    return {
        metadata: paginator.getMetadata(total),
        products,
    };
}

async function deleteProduct(id) {
    const updated = await productsRepository()
        .where("product_id", id)
        .update({ del_flag: 1 });
    return updated > 0;
}
async function hardDeleteProduct(id) {
    return await knex.transaction(async (trx) => {

        const [orders] = await trx.raw(
            `SELECT COUNT(*) as count FROM orderdetails od
             INNER JOIN product_variants pv ON od.product_variant_id = pv.product_variants_id
             WHERE pv.product_id = ?`,
            [id]
        );
        
        if (orders[0].count > 0) {
            throw new Error('Không thể xóa sản phẩm đã có trong đơn hàng. Vui lòng chỉ dừng bán mặt hàng này.');
        }
        
        const product = await trx('products')
            .where('product_id', id)
            .select('thumbnail')
            .first();
        
        const images = await trx('images')
            .where('product_id', id)
            .select('image_url');
        

        await trx('images').where('product_id', id).del();
        await trx('product_variants').where('product_id', id).del();
        await trx('product_reviews').where('product_id', id).del();
        await trx('product_image_features').where('product_id', id).del();
        await trx('products').where('product_id', id).del();
        


        if (product && product.thumbnail) {
            const thumbnailPath = product.thumbnail.startsWith('/public/uploads/')
                ? `.${product.thumbnail}`
                : `./public${product.thumbnail}`;
            try {
                await unlink(thumbnailPath);
                console.log('Deleted thumbnail:', thumbnailPath);
            } catch (err) {
                console.error('Failed to delete thumbnail:', thumbnailPath, err.message);
            }
        }
        
        const deletePromises = images.map(async (img) => {
            if (img.image_url) {
                const filePath = img.image_url.startsWith('/public/uploads/')
                    ? `.${img.image_url}`
                    : `./public${img.image_url}`;
                try {
                    await unlink(filePath);
                    console.log('Deleted image:', filePath);
                } catch (err) {
                    console.error('Failed to delete image:', filePath, err.message);
                }
            }
        });
        
        await Promise.allSettled(deletePromises);
        
        return true;
    });
}

async function restoreProduct(id) {
    const updated = await productsRepository()
        .where("product_id", id)
        .update({ del_flag: 0 });
    return updated > 0;
}

async function getProductsByIds(productIds, user_id = null) {
    if (!productIds || productIds.length === 0) {
        return [];
    }

    let query = knex('products as p')
        .leftJoin('brand as b', 'p.brand_id', 'b.id')
        .leftJoin('categories as cat', 'p.category_id', 'cat.category_id')
        .leftJoin(function() {
            this.select('product_id')
                .max('discount_percent as discount_percent')
                .from('promotion_products as pp')
                .join('promotions as pr', 'pp.promo_id', 'pr.promo_id')
                .whereRaw('NOW() BETWEEN pr.start_date AND pr.end_date')
                .where('pr.active', true)
                .groupBy('product_id')
                .as('active_promotions');
        }, 'p.product_id', 'active_promotions.product_id')
        .whereIn('p.product_id', productIds)
        .where('p.del_flag', 0)
        .select(
            'p.product_id',
            'p.name',
            'p.slug',
            'p.description',
            'p.base_price',
            'p.thumbnail',
            'p.category_id',
            'cat.category_name as category_name',
            'p.brand_id',
            'b.name as brand_name',
            'active_promotions.discount_percent',
            knex.raw(`
                CASE 
                    WHEN active_promotions.discount_percent IS NOT NULL 
                    THEN ROUND(p.base_price * (1 - active_promotions.discount_percent / 100), 2)
                    ELSE p.base_price 
                END as discounted_price
            `),
            knex.raw(`
                CASE 
                    WHEN active_promotions.discount_percent IS NOT NULL 
                    THEN true 
                    ELSE false 
                END as has_promotion
            `)
        );

    
    if (user_id) {
        query.leftJoin('favorites as f', function() {
            this.on('f.product_id', '=', 'p.product_id')
                .andOn('f.user_id', '=', knex.raw('?', [user_id]));
        }).select(
            knex.raw(`
                CASE 
                    WHEN f.favorite_id IS NOT NULL 
                    THEN true 
                    ELSE false 
                END as is_favorite
            `)
        );
    }

    const products = await query;

    if (products.length === 0) {
        return [];
    }

    const foundProductIds = products.map(p => p.product_id);

    const colors = await knex('product_variants as pv')
        .join('colors as c', 'pv.color_id', 'c.color_id')
        .whereIn('pv.product_id', foundProductIds)
        .select('pv.product_id', 'c.color_id', 'c.name as color_name', 'c.hex_code')
        .groupBy('pv.product_id', 'c.color_id', 'c.name', 'c.hex_code')
        .orderBy('c.color_id');

   
    const images = await knex('images')
        .whereIn('product_id', foundProductIds)
        .select('product_id', 'color_id', 'image_url', 'is_primary', 'display_order')
        .orderBy('display_order');

    
    const imagesByProductAndColor = {};
    for (const img of images) {
        const key = `${img.product_id}_${img.color_id}`;
        if (!imagesByProductAndColor[key]) {
            imagesByProductAndColor[key] = [];
        }
        imagesByProductAndColor[key].push({
            image_url: img.image_url,
            is_primary: img.is_primary,
            display_order: img.display_order
        });
    }

    
    const variants = await knex('product_variants as pv')
        .join('sizes as s', 'pv.size_id', 's.size_id')
        .whereIn('pv.product_id', foundProductIds)
        .select(
            'pv.product_variants_id as variant_id',
            'pv.product_id',
            'pv.color_id',
            'pv.size_id',
            's.name as size_name',
            'pv.stock_quantity',
            'pv.active'
        )
        .orderBy('pv.color_id')
        .orderBy('s.name');

    const variantsByProductAndColor = {};
    for (const variant of variants) {
        const key = `${variant.product_id}_${variant.color_id}`;
        if (!variantsByProductAndColor[key]) {
            variantsByProductAndColor[key] = [];
        }
        variantsByProductAndColor[key].push({
            variant_id: variant.variant_id,
            size_id: variant.size_id,
            size_name: variant.size_name,
            stock_quantity: variant.stock_quantity,
            active: variant.active
        });
    }

    
    const reviewsStats = await knex('product_reviews')
        .whereIn('product_id', foundProductIds)
        .select('product_id')
        .select(knex.raw('COUNT(*) as review_count'))
        .select(knex.raw('AVG(rating) as average_rating'))
        .groupBy('product_id');

    const reviewsMap = {};
    for (const stat of reviewsStats) {
        reviewsMap[stat.product_id] = {
            review_count: parseInt(stat.review_count),
            average_rating: parseFloat(stat.average_rating) || 0
        };
    }

    // 6. Combine tất cả data
    const colorsByProduct = {};
    for (const color of colors) {
        if (!colorsByProduct[color.product_id]) {
            colorsByProduct[color.product_id] = [];
        }
        const key = `${color.product_id}_${color.color_id}`;
        colorsByProduct[color.product_id].push({
            color_id: color.color_id,
            name: color.color_name,
            hex_code: color.hex_code,
            images: imagesByProductAndColor[key] || [],
            sizes: variantsByProductAndColor[key] || []
        });
    }

    for (const product of products) {
        product.colors = colorsByProduct[product.product_id] || [];
        const stats = reviewsMap[product.product_id];
        product.review_count = stats ? stats.review_count : 0;
        product.average_rating = stats ? stats.average_rating : 0;
    }

    
    const productMap = {};
    for (const product of products) {
        productMap[product.product_id] = product;
    }
    
    const sortedProducts = [];
    for (const id of productIds) {
        if (productMap[id]) {
            sortedProducts.push(productMap[id]);
        }
    }

    return sortedProducts;
}

module.exports = {
    getManyProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    hardDeleteProduct,
    restoreProduct,
    getProductsByIds,
};

