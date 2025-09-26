/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('products', function(table) {
    table.increments('product_id').primary();
    table.string('name', 255).notNullable();
    table.text('description', 'longtext');
    table.integer('brand_id').unsigned().references('id').inTable('brand').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('category_id').unsigned().references('category_id').inTable('categories').onDelete('SET NULL');
    table.boolean('del_flag').defaultTo(0);
    table.string('slug', 200);

    // Indexes
    table.index('category_id', 'idx_product_category');
    table.index('brand_id', 'fk_product_brand_idx');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('products');
};
