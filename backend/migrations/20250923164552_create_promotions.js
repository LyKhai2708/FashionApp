/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('promotions', function(table) {
    table.increments('promo_id').primary();

    table.string('name', 100).notNullable();

    table.text('description').nullable();

    table.integer('discount_percent')
      .unsigned()
      .checkBetween([0, 100]) // kiểm tra từ 0 đến 100
      .nullable();

    table.date('start_date').notNullable();

    table.date('end_date').notNullable();

    table.boolean('active').defaultTo(true);

    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('promotions');
};
