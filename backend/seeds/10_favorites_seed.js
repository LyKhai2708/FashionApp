const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('favorites').del();


  const users = await knex('users').select('user_id');
  const products = await knex('products').select('product_id');

  const favorites = [];


  for (const user of users) {
    const numFavorites = faker.number.int({ min: 3, max: 8 });
    const selectedProducts = faker.helpers.arrayElements(products, numFavorites);
    
    for (const product of selectedProducts) {
      favorites.push({
        user_id: user.user_id,
        product_id: product.product_id,
        created_at: faker.date.past()
      });
    }
  }

  await knex('favorites').insert(favorites);
};
