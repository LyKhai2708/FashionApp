exports.up = function(knex) {
  return knex.schema.createTable('product_reviews', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.integer('product_id').notNullable();
    table.integer('is_verified_purchase').boolean().notNullable();
    table.string('title', 255).notNullable();
    table.text('comment');
    table.specificType('rating', 'TINYINT').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('users.user_id').onDelete('CASCADE');
    table.foreign('product_id').references('products.product_id').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('product_reviews');
};
