/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('orderdetails', function(table) {
    table.increments('order_detail_id').primary();

    table.integer('quantity').notNullable();

    table.decimal('price', 10, 2).notNullable();

    table.integer('product_variant_id').unsigned().notNullable()
      .references('product_variants_id').inTable('product_variants')
      .onDelete('RESTRICT'); // không cho xóa variant nếu còn đơn hàng

    table.integer('order_id').unsigned().notNullable()
      .references('order_id').inTable('orders')
      .onDelete('CASCADE'); // xóa đơn hàng -> xóa chi tiết đơn
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('orderdetails');
};
