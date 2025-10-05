const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('product_colors').del();

  // Lấy danh sách products và colors
  const products = await knex('products').select('product_id');
  const colors = await knex('colors').select('color_id');

  const productColors = [];

  // Mỗi sản phẩm có 2-5 màu ngẫu nhiên
  for (const product of products) {
    const numColors = faker.number.int({ min: 2, max: 5 });
    const selectedColors = faker.helpers.arrayElements(colors, numColors);
    
    for (const color of selectedColors) {
      productColors.push({
        product_id: product.product_id,
        color_id: color.color_id
      });
    }
  }

  await knex('product_colors').insert(productColors);
};
