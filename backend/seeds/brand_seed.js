const { faker } = require('@faker-js/faker');

/**
 * Tạo brand giả lập
 */
function createBrand() {
  return {
    name: faker.company.name(),
    created_at: faker.date.past(),
    active: faker.datatype.boolean(),
  };
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('brand').del();
  await knex('brand').insert(Array(10).fill().map(createBrand));
};