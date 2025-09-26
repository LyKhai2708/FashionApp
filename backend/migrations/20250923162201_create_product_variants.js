/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('product_variants', function(table) {
    table.increments('product_variants_id').primary();

    table.integer('product_id').unsigned().notNullable()
      .references('product_id').inTable('products')
      .onDelete('CASCADE');

    table.integer('size_id').unsigned().nullable()
      .references('size_id').inTable('sizes')
      .onDelete('SET NULL');

    table.integer('color_id').unsigned().nullable()
      .references('color_id').inTable('colors')
      .onDelete('SET NULL');

    table.integer('stock_quantity').defaultTo(0);
    table.decimal('price', 10, 2).notNullable();

    table.unique(['product_id', 'size_id', 'color_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('product_variants');
};
