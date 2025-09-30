/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('carts', function(table) {
    table.increments('cart_id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users')
      .onDelete('CASCADE');
    table.integer('product_variant_id').unsigned().notNullable()
      .references('product_variant_id').inTable('product_variants')
      .onDelete('CASCADE');
    table.integer('quantity').notNullable().defaultTo(1);
    table.timestamp('added_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('carts');
};
