/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.increments('id').primary();

    table.integer('order_id').unsigned().notNullable()
      .references('order_id').inTable('orders')
      .onDelete('CASCADE'); // Xóa order -> xóa payment

    table.timestamp('payment_date').defaultTo(knex.fn.now());

    table.decimal('amount', 10, 2).notNullable();

    table.enu('method', ['credit_card','bank_transfer','cash_on_delivery','paypal'])
      .notNullable();

    table.enu('status', ['paid','pending','failed'])
      .defaultTo('pending');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};
