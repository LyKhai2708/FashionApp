/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.increments('order_id').primary();

    table.timestamp('order_date').defaultTo(knex.fn.now());

    table.enu('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .defaultTo('pending');

    table.decimal('total_amount', 12, 2).nullable();
    table.text('notes').nullable();

    table.text('shipping_address').nullable();

    table.integer('user_id').unsigned().nullable()
      .references('user_id').inTable('users')
      .onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};
