/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('user_addresses', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable();
        table.string('province', 100).notNullable();
        table.integer('province_code').notNullable();
        table.string('ward', 100).notNullable();
        table.integer('ward_code').notNullable();
        table.text('detail_address').notNullable();
        table.boolean('is_default').defaultTo(false);
        table.string('receiver_name', 100);
        table.string('receiver_phone', 20);
        table.string('receiver_email', 100);

        table.foreign('user_id').references('user_id').inTable('users').onDelete('CASCADE');
        
        // Index
        table.index('user_id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('user_addresses');
};
