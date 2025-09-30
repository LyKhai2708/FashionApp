const knex = require('../database/knex');
const slugify = require('./slugify');
const Paginator = require('./paginator');

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
        // Bước 1: Tạo sản phẩm chính
        const product = readProduct(payload);
        const [product_id] = await trx("products").insert(product);
        
        // Bước 2: Thêm màu sắc cho sản phẩm (product_colors)
        const colorInserts = [];
        const colorMap = new Map(); // Map để lưu color_id -> product_color_id
        
        if (payload.colors && payload.colors.length > 0) {
            payload.colors.forEach((color, index) => {
                colorInserts.push({
                    product_id: product_id,
                    color_id: color.color_id,
                    display_order: color.display_order || index + 1
                });
            });
            
            // Insert product_colors và lấy các ID
            const productColorIds = await trx("product_colors").insert(colorInserts);
            
            // Map color_id với product_color_id
            payload.colors.forEach((color, index) => {
                const productColorId = productColorIds[0] + index; // MySQL auto increment
                colorMap.set(color.color_id, productColorId);
            });
        }
        
        // Bước 3: Thêm ảnh cho từng màu (product_images)
        if (payload.colors && payload.colors.length > 0) {
            for (const color of payload.colors) {
                if (color.images && color.images.length > 0) {
                    const productColorId = colorMap.get(color.color_id);
                    const imageInserts = color.images.map((image, index) => ({
                        product_color_id: productColorId,
                        image_url: image.url,
                        is_primary: image.is_primary || index === 0, // Ảnh đầu tiên là primary
                        display_order: image.display_order || index + 1
                    }));
                    
                    await trx("images").insert(imageInserts);
                }
            }
        }
        
        // Bước 4: Thêm các biến thể (product_variants)
        if (payload.variants && payload.variants.length > 0) {
            const variantInserts = payload.variants.map(variant => ({
                product_id: product_id,
                color_id: variant.color_id,
                size_id: variant.size_id,
                stock_quantity: variant.stock_quantity || 0,
                additional_price: variant.additional_price || 0,
                active: variant.active !== undefined ? variant.active : 1
            }));
            
            await trx("product_variants").insert(variantInserts);
        }
        return { 
            ...product, 
            product_id,
            colors_added: payload.colors?.length || 0,
            variants_added: payload.variants?.length || 0
        };
    });
}

async function getProductById(id) {
    const promotionSubquery = knex.raw(
        `(SELECT pp.product_id, p.discount_percent, p.name as promo_name, p.promo_id
        FROM promotion_products pp
        JOIN promotions p ON pp.promo_id = p.promo_id
        WHERE p.active = TRUE
        AND p.start_date <= CURDATE()
        AND p.end_date >= CURDATE()) AS active_promotions`
    );

    const product = await knex('products as p')
        .leftJoin('brands as b', 'p.brand_id', 'b.id')
        .leftJoin('categories as c', 'p.category_id', 'c.category_id')
        .leftJoin(promotionSubquery, 'p.product_id', 'active_promotions.product_id')
        .where('p.product_id', id)
        .where('p.del_flag', 0)
        .select(
            'p.*',
            'b.name as brand_name',
            'c.name as category_name',
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
            `)
        )
        .first();

    if (!product) return null;

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

    // Lấy tất cả ảnh theo màu cho product này (không phụ thuộc vào product_colors)
    const colorIds = [...new Set(variants.map(v => v.color_id))];
    const images = await knex('images as img')
        .join('product_colors as pc', 'img.product_color_id', 'pc.product_color_id')
        .where('pc.product_id', id)
        .whereIn('pc.color_id', colorIds)
        .select(
            'pc.color_id',
            'img.image_url', 
            'img.is_primary', 
            'img.display_order'
        )
        .orderBy('img.display_order');

    // Gắn ảnh theo color_id thay vì product_color_id
    const imagesByColor = {};
    for (const img of images) {
        if (!imagesByColor[img.color_id]) {
            imagesByColor[img.color_id] = [];
        }
        imagesByColor[img.color_id].push({
            image_url: img.image_url,
            is_primary: img.is_primary,
            display_order: img.display_order
        });
    }

    // Format variants với thông tin đầy đủ
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
        final_price: parseFloat(product.base_price),
        active: variant.active
    }));

    return {
        ...product,
        variants: formattedVariants,
        price_info: {
            base_price: parseFloat(product.base_price),
            discounted_price: parseFloat(product.discounted_price),
            discount_percent: product.discount_percent,
            has_promotion: product.has_promotion
        }
    };
}
  
async function updateProduct(id, payload) {
    const updatedProduct = await productsRepository().where("product_id", id).select('*').first();
    if (!updatedProduct) return null;

    const update = readProduct(payload);
    if(!update.thumbnail){
        delete update.thumbnail;
    }
    await productsRepository().where("product_id", id).update(update);
    if(update.thumbnail &&
        updatedProduct.thumbnail &&
        update.thumbnail !== updateProduct.thumbnail
        && updatedProduct.thumbnail.startsWith('/public/uploads/'))
    {
        unlink(`.${updatedProduct.thumbnail}`, (err) => {});
    }
    return { ...updatedProduct, ...update };
}


  
async function getManyProducts(query) {
    const { name, brand_id, category_id, category_slug, del_flag, min_price, max_price, color_id, size_id, page = 1, limit = 10 } = query;

    const paginator = new Paginator(page, limit);

    // Subquery cho promotions
    const promotionSubquery = knex.raw(
        `(SELECT pp.product_id, p.discount_percent
        FROM promotion_products pp
        JOIN promotions p ON pp.promo_id = p.promo_id
        WHERE p.active = TRUE
        AND p.start_date <= CURDATE()
        AND p.end_date >= CURDATE()) AS active_promotions`
    );

    const isVariantJoin = min_price || max_price || color_id || size_id;
    const isCategoryJoin = category_slug;
    
    let baseQuery = knex('products as p')
        .leftJoin('brands as b', 'p.brand_id', 'b.id')
        .leftJoin('categories as c', 'p.category_id', 'c.category_id')
        .leftJoin(promotionSubquery, 'p.product_id', 'active_promotions.product_id');
        
    if(isVariantJoin){
        baseQuery = baseQuery
            .join('product_variants as pv', 'p.product_id', 'pv.product_id');
    }
    if (isCategoryJoin) {
        baseQuery = baseQuery
            .join('categories as cat', 'p.category_id', 'cat.category_id');
    }

    let result = await baseQuery
        .where((builder) => {
            if (name) {
                builder.where('p.name', 'like', `%${name}%`);
            }
            if (brand_id) {
                builder.where('p.brand_id', brand_id);
            }
            if (category_id) {
                builder.where('p.category_id', category_id);
            }
            if (category_slug) {
                builder.where('cat.slug', category_slug);
            }
            if (del_flag !== undefined) {
                builder.where('p.del_flag', del_flag == '1' || del_flag == 'true' ? 1 : 0);
            } else {
                builder.where('p.del_flag', 0); // Mặc định chỉ lấy sản phẩm chưa xóa
            }
            if (min_price) {
                builder.where('p.base_price', '>=', min_price);
            }
            if (max_price) {
                builder.where('p.base_price', '<=', max_price);
            }
            if (color_id) {
                builder.where('pv.color_id', color_id);
            }
            if (size_id) {
                builder.where('pv.size_id', size_id);
            }
        })
        .select(
            knex.raw('count(DISTINCT p.product_id) OVER() AS recordCount'),
            'p.product_id',
            'p.name',
            'p.description',
            'p.slug',
            'p.base_price',
            'p.thumbnail',
            'p.brand_id',
            'p.category_id',
            'p.created_at',
            'p.updated_at',
            'b.name as brand_name',
            'c.name as category_name',
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
        )
        .distinct('p.product_id')
        .limit(paginator.limit)
        .offset(paginator.offset);

    let totalRecords = 0;
    const products = result.map((item) => {
        totalRecords = item.recordCount;
        delete item.recordCount;
        return item;
    });

    // Lấy màu sắc và ảnh cho từng sản phẩm
    if (products.length > 0) {
        const productIds = products.map(p => p.product_id);
        
        // Lấy màu sắc
        const colors = await knex('product_colors as pc')
            .join('colors as c', 'pc.color_id', 'c.color_id')
            .whereIn('pc.product_id', productIds)
            .select('pc.product_id', 'pc.product_color_id', 'c.color_id', 'c.name as color_name', 'c.hex_code', 'pc.display_order')
            .orderBy('pc.display_order');

        // Lấy ảnh cho các màu
        const productColorIds = colors.map(c => c.product_color_id);
        const images = await knex('images')
            .whereIn('product_color_id', productColorIds)
            .select('product_color_id', 'image_url', 'is_primary', 'display_order')
            .orderBy('display_order');

        // Gom ảnh theo product_color_id
        const imagesByProductColor = {};
        for (const img of images) {
            if (!imagesByProductColor[img.product_color_id]) {
                imagesByProductColor[img.product_color_id] = [];
            }
            imagesByProductColor[img.product_color_id].push({
                image_url: img.image_url,
                is_primary: img.is_primary,
                display_order: img.display_order
            });
        }

        // Gom màu theo product_id và gắn ảnh
        const colorsByProduct = {};
        for (const color of colors) {
            if (!colorsByProduct[color.product_id]) {
                colorsByProduct[color.product_id] = [];
            }
            colorsByProduct[color.product_id].push({
                color_id: color.color_id,
                name: color.color_name,
                hex_code: color.hex_code,
                images: imagesByProductColor[color.product_color_id] || []
            });
        }

        // Gắn màu vào từng sản phẩm
        for (const product of products) {
            product.colors = colorsByProduct[product.product_id] || [];
            product.price_info = {
                base_price: parseFloat(product.base_price),
                discounted_price: parseFloat(product.discounted_price),
                discount_percent: product.discount_percent || 0,
                has_promotion: product.has_promotion
            };
        }
    }

    return {
        metadata: paginator.getMetadata(totalRecords),
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
        // 1. Lấy tất cả ảnh cần xóa
        const images = await trx('images as img')
            .join('product_colors as pc', 'img.product_color_id', 'pc.product_color_id')
            .where('pc.product_id', id)
            .select('img.image_url');
        
        // 2. Xóa dữ liệu database
        await trx('images').whereIn('product_color_id', 
            trx('product_colors').where('product_id', id).select('product_color_id')
        ).del();
        await trx('product_variants').where('product_id', id).del();
        await trx('product_colors').where('product_id', id).del();
        await trx('products').where('product_id', id).del();
        
        // 3. Xóa files
        for (const img of images) {
            if (img.image_url?.startsWith('/public/uploads/')) {
                unlink(`.${img.image_url}`, (err) => {
                    if (err) console.error('Failed to delete image:', img.image_url);
                });
            }
        }
        
        return true;
    });
}

async function restoreProduct(id) {
    const updated = await productsRepository()
        .where("product_id", id)
        .update({ del_flag: 0 });
    return updated > 0;
}
module.exports = {
    getManyProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    hardDeleteProduct,
    restoreProduct,
};

