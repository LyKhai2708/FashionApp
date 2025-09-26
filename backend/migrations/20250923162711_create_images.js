/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('images', function(table) {
    table.increments('image_id').primary();

    table.integer('product_variants_id').unsigned().nullable()
      .references('product_variants_id').inTable('product_variants')
      .onDelete('CASCADE');

    table.string('image_url', 255).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('images');
};
