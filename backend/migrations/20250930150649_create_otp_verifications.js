/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('otp_verifications', function(table) {
    table.increments('id').primary();
    table.string('phone', 15).notNullable();
    table.string('otp', 6).notNullable();
    table.string('purpose').notNullable(); 
    table.text('userdata'); //thông tin user khi đăng ký
    table.integer('user_id').unsigned().nullable(); 
    table.timestamp('expires_at').notNullable();
    table.integer('attempts').defaultTo(0);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('verified_at').nullable();
    table.timestamps(true, true);
    
    table.index('phone');
    table.index('otp');
    table.index(['phone', 'purpose']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('otp_verifications');
};
