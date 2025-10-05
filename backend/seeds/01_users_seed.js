const { faker } = require('@faker-js/faker');

/**
 * Tạo một user giả lập
 */
function createUser() {
  return {
    username: faker.internet.username(),
    password: faker.internet.password(12),
    email: faker.internet.email(),
    phone: faker.string.numeric('09########'),
    address: faker.location.streetAddress(),
    role: faker.helpers.arrayElement(['customer', 'admin']),
    created_at: faker.date.past(),
    del_flag: faker.datatype.boolean(),
  };
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('users').del();
  await knex('users').insert(Array(50).fill().map(createUser));
};