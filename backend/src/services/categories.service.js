const knex = require('../database/knex');
const Paginator = require('./paginator');
const slugify = require('./slugify');
function categoryRepository() {
    return knex('categories');
}
function readCategory(payload) {
    const category = {
        category_name: payload.category_name,
        parent_id: payload.parent_id || null,
    }
    if (payload.slug && payload.slug.trim() !== "") {
      category.slug = slugify(payload.slug);
    } else if (payload.category_name) {
      category.slug = slugify(payload.category_name);
    }
    return category;
}

async function createCategory(payload) {
    const category = readCategory(payload);
    const [id] = await categoryRepository().insert(category);
    return { category_id: id, ...category };
  }
  
  async function getCategoryById(id) {
    console.log('aaaaaa');
    console.log(id);
    console.log(await categoryRepository().where('category_id', id).first());
    return await categoryRepository().where('category_id', id).first();
  }
  
  async function getCategoryByName(name, excludeId = null) {
    let query = categoryRepository().where('category_name', name);
    if (excludeId) {
      query = query.andWhereNot('category_id', excludeId);
    }
    return await query.first();
  }
  
  async function updateCategory(id, payload) {
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) return null;
  
    const category = readCategory(payload);
    await categoryRepository().where('category_id', id).update(category);
    return { ...existingCategory, ...category };
  }
  
  async function deleteCategory(id) {
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) return null;
  
    await categoryRepository().where('category_id', id).update({active: 0});
    return existingCategory;
  }
  
  async function getAllCategories({ page = 1, limit = 10, name, parent_id } = {}) {
    const paginator = new Paginator(page, limit);
  
    let result = await categoryRepository()
      .where((builder) => {
        if (name) {
          builder.whereILike('category_name', `%${name}%`);
        }
        if (parent_id !== undefined) {
          builder.where('parent_id', parent_id);
        }
      })
      .select(
        knex.raw('count(category_id) OVER() AS recordCount'),
        'category_id',
        'category_name',
        'slug',
        'parent_id'
      ).where('active', 1)
      .limit(paginator.limit)
      .offset(paginator.offset);
  
    let totalRecords = 0;
    const categories = result.map((item) => {
      totalRecords = item.recordCount;
      delete item.recordCount;
      return item;
    });
  
    return {
      metadata: paginator.getMetadata(totalRecords),
      categories,
    };
  }
  
  async function deleteAllCategories() {
    await categoryRepository().update({active: 0});
    return true;
  }

  async function getCategoryBySlug(slug) {
    return await categoryRepository().where('slug', slug).first();
  }
  module.exports = {
    createCategory,
    getCategoryById,
    getCategoryByName,
    updateCategory,
    deleteCategory,
    getAllCategories,
    deleteAllCategories,
  };