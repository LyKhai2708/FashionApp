const knex = require('../database/knex');
const Paginator = require('./paginator');
const slugify = require('./slugify');
const { unlink } = require('fs').promises;
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

    if (payload.description !== undefined) {
      category.description = payload.description;
    }

    if (payload.image_url !== undefined) {
      category.image_url = payload.image_url;
    }

    return category;
}

async function createCategory(payload) {
    const category = readCategory(payload);
    
    if (category.parent_id) {
        const validDepth = await isValidCategoryDepth(category.parent_id, 2);
        if (!validDepth) {
            throw new Error("Chỉ được tạo tối đa 2 cấp category (cha - con)");
        }
    }
    
    const [id] = await categoryRepository().insert(category);
    return { category_id: id, ...category };
  }
  
  async function getCategoryById(id) {
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
    
    if (category.parent_id !== undefined && category.parent_id !== null) {
        const children = await categoryRepository()
            .where('parent_id', id)
            .select('category_id');
        
        if (children.length > 0) {
            throw new Error('Danh mục đã có danh mục con, không thể chuyển thành danh mục con. Vui lòng xóa hoặc di chuyển danh mục con trước.');
        }
        
        const newParent = await getCategoryById(category.parent_id);
        if (newParent && newParent.parent_id !== null) {
            throw new Error('Chỉ được phép 2 cấp danh mục. Danh mục cha bạn chọn đã là danh mục con.');
        }
    }
    
    if (existingCategory.image_url) {
      if (category.image_url && category.image_url !== existingCategory.image_url) {
        const oldImagePath = existingCategory.image_url.startsWith('/public/uploads/')
          ? `.${existingCategory.image_url}`
          : `./public${existingCategory.image_url}`;
        try {
          await unlink(oldImagePath);
          console.log('Deleted old category image:', oldImagePath);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error('Failed to delete old category image:', oldImagePath, err.message);
          }
        }
      } else if (category.image_url === null) {
        const oldImagePath = existingCategory.image_url.startsWith('/public/uploads/')
          ? `.${existingCategory.image_url}`
          : `./public${existingCategory.image_url}`;
        try {
          await unlink(oldImagePath);
          console.log('Deleted category image:', oldImagePath);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error('Failed to delete category image:', oldImagePath, err.message);
          }
        }
      }
    }
    
    await categoryRepository().where('category_id', id).update(category);
    return { ...existingCategory, ...category };
  }
  
    async function toggleCategoryStatus(id) {
      const existingCategory = await getCategoryById(id);
      if (!existingCategory) return null;

      const newStatus = existingCategory.active === 1 ? 0 : 1;
      await categoryRepository().where('category_id', id).update({active: newStatus});

      if (newStatus === 0) {
        await categoryRepository().where('parent_id', id).update({active: 0});
      }
      
      return { ...existingCategory, active: newStatus };
    }

  async function deleteCategory(id) {
    return await toggleCategoryStatus(id);
  }
  
    async function getAllCategoriesIncludeInactive({ page = 1, limit = 10, name, parent_id, active } = {}) {
    const paginator = new Paginator(page, limit);

    let result = await categoryRepository()
      .where((builder) => {
        if (name) {
          builder.whereILike('category_name', `%${name}%`);
        }
        if (parent_id !== undefined) {
          builder.where('parent_id', parent_id);
        }
        if (active !== undefined) {
          builder.where('active', active);
        }
      })
      .select(
        knex.raw('count(category_id) OVER() AS recordCount'),
        'category_id',
        'category_name',
        'description',
        'slug',
        'image_url',
        'parent_id',
        'active'
      )
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
        'description',
        'slug',
        'image_url',
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
  async function isLeafCategory(categoryId) {
    const children = await categoryRepository()
        .where('parent_id', categoryId)
        .select('category_id');
    return children.length === 0;
}

async function getCategoryDepth(categoryId) {
    let depth = 0;
    let currentId = categoryId;
    
    while (currentId !== null) {
        const parent = await categoryRepository()
            .where('category_id', currentId)
            .select('parent_id')
            .first();
        
        if (!parent) break;
        
        depth++;
        currentId = parent.parent_id;
        
        if (depth > 2) break;
    }
    
    return depth;
}

async function isValidCategoryDepth(categoryId, maxDepth = 2) {
    const depth = await getCategoryDepth(categoryId);
    return depth < maxDepth;
}

module.exports = {
    createCategory,
    getCategoryById,
    getCategoryByName,
    toggleCategoryStatus,
    getAllCategoriesIncludeInactive,
    updateCategory,
    deleteCategory,
    getAllCategories,
    deleteAllCategories,
    getCategoryBySlug,
    isLeafCategory,
    getCategoryDepth,
    isValidCategoryDepth,
  };