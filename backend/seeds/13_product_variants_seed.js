const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('product_variants').del();

  // Lấy danh sách product_colors, sizes
  const productColors = await knex('product_colors').select('product_id', 'color_id');
  const sizes = await knex('sizes').select('size_id');

  const productVariants = [];

  // Mỗi product_color có 3-6 sizes
  for (const pc of productColors) {
    const numSizes = faker.number.int({ min: 3, max: 6 });
    const selectedSizes = faker.helpers.arrayElements(sizes, numSizes);
    
    for (const size of selectedSizes) {
      productVariants.push({
        product_id: pc.product_id,
        color_id: pc.color_id,
        size_id: size.size_id,
        stock_quantity: faker.number.int({ min: 0, max: 100 }),
        active: faker.datatype.boolean() ? 1 : 0
      });
    }
  }

  await knex('product_variants').insert(productVariants);
};
