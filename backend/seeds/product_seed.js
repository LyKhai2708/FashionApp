const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('products').del();

  // Lấy danh sách brand_id và category_id
  const brands = await knex('brand').select('id');
  const categories = await knex('categories').select('category_id');

  function createProduct() {
    const brand = faker.helpers.arrayElement(brands);
    const category = faker.helpers.arrayElement(categories);
    const name = faker.commerce.productName();
    return {
      name,
      description: faker.commerce.productDescription(),
      brand_id: brand ? brand.id : null,
      category_id: category ? category.category_id : null,
      created_at: faker.date.past(),
      del_flag: faker.datatype.boolean(),
      slug: faker.helpers.slugify(name),
    };
  }

  await knex('products').insert(Array(50).fill().map(createProduct));
};