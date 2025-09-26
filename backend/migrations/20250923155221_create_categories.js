/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("categories", function (table) {
    table.increments("category_id").primary();
    table.string("category_name", 100).notNullable().unique();
    table.string("slug", 200).nullable();
    table
      .integer("parent_id")
      .unsigned()
      .nullable()
      .references("category_id")
      .inTable("categories")
      .onDelete("CASCADE")
      .index("fk_parent_category_idx");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("categories");
};
