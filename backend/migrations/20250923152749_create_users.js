/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable("users", function (table) {
    table.increments("user_id").primary();
    table.string("username", 100).notNullable().unique();
    table.string("password", 255).notNullable();
    table.string("email", 255).notNullable().unique();
    table.string("phone", 20);
    table.text("address");
    table.enum("role", ["customer", "admin"]).defaultTo("customer");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.boolean("is_active").nullable().defaultTo(1);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("users");
};
