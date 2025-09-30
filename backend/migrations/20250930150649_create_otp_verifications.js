/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('otp_verifications', function(table) {
    table.increments('otp_verification_id').primary();
    table.varchar('phone', 15).notNullable();
    table.varchar('otp', 6).notNullable();
    table.json('userdata').nullable();
    table.timestamp('expires_at').notNullable();
    table.integer('attempts').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('otp_verifications');
};
