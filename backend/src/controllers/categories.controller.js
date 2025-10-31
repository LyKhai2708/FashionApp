const ApiError = require('../api-error')
const categoryService = require('../services/categories.service');
const JSend = require('../jsend');


async function createCategory(req, res, next) {
  const {category_name, parent_id, description} = req.body;
  if(!category_name || typeof category_name !== 'string') {
    return next(new ApiError(400, 'Category name should be non-empty string'));
  }
  const duplicate = await categoryService.getCategoryByName(category_name);
  if(duplicate){
    return next(new ApiError(409, 'Category name already exists'));
  }

  try{
    const payload = {...req.body};

    if (req.file) {
      payload.image_url = `/public/uploads/${req.file.filename}`;
    }

    const category = await categoryService.createCategory(payload);
    return res
    .status(201)
    .set({
        Location: `${req.baseUrl}/${category.category_id}`
    })
    .json(JSend.success({category}));
  }catch(error){
    console.log(error);
    return (next(new ApiError(500, 'An error occurred while creating category')));
  }
}
async function toggleCategoryStatus(req, res, next) {
  try {
    const toggled = await categoryService.toggleCategoryStatus(req.params.id);
    if (!toggled) return next(new ApiError(404, 'Category not found'));
    return res.json(JSend.success({ category: toggled }));
  } catch (err) {
    next(new ApiError(500, 'Error toggling category status'));
  }
}
async function getCategoriesbyFilter(req, res, next) {
    let result = {
      metadata: {
        totalRecords: 0,
        firstPage: 1,
        lastPage: 1,
        page: 1,
        limit: 5,
      },
      categories: []
    };
  try {
    if ( req.query.include_inactive === 'true') {
      result = await categoryService.getAllCategoriesIncludeInactive(req.query);
    } else {
      result = await categoryService.getAllCategories(req.query);
    }

  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'Internal server error'));
  }
  return res.json(JSend.success({
    metadata: result.metadata,
    categories: result.categories
  }));
}

async function updateCategory(req, res, next) {
    try {
      const payload = {...req.body};

      if (req.file) {
        payload.image_url = `/public/uploads/${req.file.filename}`;
      } else if (req.body.remove_image === 'true') {
        payload.image_url = null;
      }

      const updated = await categoryService.updateCategory(req.params.category_id, payload);
      if (!updated) return next(new ApiError(404, 'Category not found'));
      return res.json(JSend.success({ category: updated }));
    } catch (err) {
      console.error('Update category error:', err);
      next(new ApiError(500, 'Error updating category'));
    }
  }
  
  //xoá category
  async function deleteCategory(req, res, next) {
    try {
      const deleted = await categoryService.deleteCategory(req.params.category_id);
      if (!deleted) return next(new ApiError(404, 'Category not found'));
      return res.json(JSend.success({ category: deleted }));
    } catch (err) {
      next(new ApiError(500, 'Error deleting category'));
    }
  }
  async function getCategory(req, res, next) {
    const {id} = req.params;
    console.log(id);
    try {
      const category = await categoryService.getCategoryById(id);
      if (!category) return next(new ApiError(404, 'Category not found'));
      return res.json(JSend.success({ category }));
    } catch (err) {
      console.log(err);
      next(new ApiError(500, 'Error fetching category'));
    }
  }
  async function deleteAllCategories(req, res, next) {
    try{
        const deleted = await categoryService.deleteAllCategories();
        return res.json(JSend.success());
    }catch(error){
        console.log(error);
        return next(new ApiError(500, 'Error deleting all categories'));
    }
  }
module.exports = {
  createCategory,
  getCategoriesbyFilter,
  toggleCategoryStatus,
  updateCategory,
  deleteCategory,
  getCategory,
  deleteAllCategories
}