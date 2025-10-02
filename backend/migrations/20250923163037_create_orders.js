/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.increments('order_id').primary();

    table.timestamp('order_date').defaultTo(knex.fn.now());

    table.enu('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .defaultTo('pending');
    table.decimal('sub_total', 10, 2).notNullable();
    table.decimal('shipping_fee', 10, 2).defaultTo(0);
    table.decimal('total_amount', 10, 2).defaultTo(0);
    table.enu('payment_method', ['cash_on_delivery', 'bank_transfer'])
      .defaultTo('cash_on_delivery');
    table.enu('payment_status', ['unpaid', 'paid', 'refund'])
      .defaultTo('unpaid');
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
