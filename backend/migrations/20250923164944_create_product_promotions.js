/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('promotion_products', function(table) {
    table.integer('promo_id').unsigned().notNullable();
    table.integer('product_id').unsigned().notNullable();

    table.primary(['promo_id', 'product_id']);

    table
      .foreign('promo_id')
      .references('promo_id')
      .inTable('promotions')
      .onDelete('CASCADE');

    table
      .foreign('product_id')
      .references('product_id')
      .inTable('products')
      .onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('promotion_products');
};
