/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable("colors", function (table) {
    table.increments("color_id").primary();
    table.string("name", 50).notNullable().unique();
    table.string("hex_code", 7).notNullable().unique(); // mã màu hex, ví dụ: #FFFFFF
  });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("colors");
};
