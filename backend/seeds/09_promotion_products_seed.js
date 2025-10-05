const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('promotion_products').del();

  // Lấy danh sách promotions và products
  const promotions = await knex('promotions').select('promo_id');
  const products = await knex('products').select('product_id');

  const promotionProducts = [];

  // Mỗi promotion có 5-10 sản phẩm ngẫu nhiên
  for (const promo of promotions) {
    const numProducts = faker.number.int({ min: 5, max: 10 });
    const selectedProducts = faker.helpers.arrayElements(products, numProducts);
    
    for (const product of selectedProducts) {
      promotionProducts.push({
        promo_id: promo.promo_id,
        product_id: product.product_id
      });
    }
  }

  await knex('promotion_products').insert(promotionProducts);
};
