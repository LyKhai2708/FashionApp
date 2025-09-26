const { faker } = require('@faker-js/faker');

/**
 * Tạo category giả lập
 */
function createCategory(parentIds = []) {
  return {
    category_name: faker.commerce.department() + ' ' + faker.string.alpha(3),
    slug: faker.helpers.slugify(faker.commerce.department()),
    parent_id: parentIds.length && faker.datatype.boolean() ? faker.helpers.arrayElement(parentIds) : null,
  };
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('categories').del();

  const parentCat = Array(10).fill().map(() => createCategory([]));
  const parentId = [];
  //thêm danh mục cha trước để lấy id
  for(const cat of parentCat) {
    const [id] = await knex('categories').insert(cat).returning('category_id');
    parentId.push(id);
  }


  const childCategories = Array(20).fill().map(() => createCategory(parentId));
  await knex('categories').insert(childCategories);
};