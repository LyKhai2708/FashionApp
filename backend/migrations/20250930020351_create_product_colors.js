/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('product_colors', function(table) {
    table.increments('product_color_id').primary();
    table.integer('product_id').unsigned().notNullable()
      .references('product_id').inTable('products')
      .onDelete('CASCADE');
    table.integer('color_id').unsigned().notNullable()
      .references('color_id').inTable('colors')
      .onDelete('CASCADE');
    table.unique(['product_id', 'color_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('product_colors');
};
