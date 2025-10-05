const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('images').del();

  // Lấy danh sách product_colors
  const productColors = await knex('product_colors').select('product_color_id', 'product_id');

  const images = [];

  // Mỗi product_color có 2-4 ảnh
  for (const pc of productColors) {
    const numImages = faker.number.int({ min: 2, max: 4 });
    
    for (let i = 0; i < numImages; i++) {
      images.push({
        product_color_id: pc.product_color_id,
        image_url: `/images/products/product-${pc.product_id}-color-${pc.product_color_id}-${i + 1}.jpg`
      });
    }
  }

  await knex('images').insert(images);
};
