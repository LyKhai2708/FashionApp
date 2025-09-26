/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('favorites', function(table) {
    table.increments('favorite_id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users')
      .onDelete('CASCADE');
    table.integer('product_id').unsigned().notNullable()
      .references('product_id').inTable('products')
      .onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['user_id', 'product_id']); // một user chỉ có thể favorite 1 product một lần
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('favorites');
};
