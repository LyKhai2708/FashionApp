const { faker } = require('@faker-js/faker');

/**
 * Tạo thương hiệu thời trang
 */
function createFashionBrands() {
  const fashionBrands = [
    'Zara', 'H&M', 'Uniqlo', 'Nike', 'Adidas',
    'Gucci', 'Louis Vuitton', 'Chanel', 'Dior', 'Prada',
    'Calvin Klein', 'Tommy Hilfiger', 'Ralph Lauren', 'Lacoste', 'Polo',
    'Levi\'s', 'Gap', 'Forever 21', 'Mango', 'Massimo Dutti',
    'COS', 'Arket', 'Weekday', 'Monki', '& Other Stories',
    'Canifa', 'IVY Moda', 'Routine', 'Yody', 'Owen'
  ];

  return fashionBrands.map(brandName => ({
    name: brandName,
    active: 1,
    created_at: faker.date.past()
  }));
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('brand').del();
  await knex('brand').insert(createFashionBrands());
};