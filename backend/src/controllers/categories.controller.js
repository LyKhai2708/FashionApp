const ApiError = require('../api-error')
const categoryService = require('../services/categories.service');
const JSend = require('../jsend');

async function createCategory(req, res, next) {
  const {category_name, parent_id} = req.body;
  if(!category_name || typeof category_name !== 'string') {
    return next(new ApiError(400, 'Category name should be non-empty string'));
  }
  const duplicate = await categoryService.getCategoryByName(category_name);
  if(duplicate){
    return next(new ApiError(409, 'Category name already exists'));
  }
  try{
    const category = await categoryService.createCategory({...req.body});
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
    result = await categoryService.getAllCategories(req.query);

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
      const updated = await categoryService.updateCategory(req.params.id, req.body);
      if (!updated) return next(new ApiError(404, 'Category not found'));
      return res.json(JSend.success({ category: updated }));
    } catch (err) {
      next(new ApiError(500, 'Error updating category'));
    }
  }
  
  //xoá category
  async function deleteCategory(req, res, next) {
    try {
      const deleted = await categoryService.deleteCategory(req.params.id);
      if (!deleted) return next(new ApiError(404, 'Category not found'));
      return res.json(JSend.success({ category: deleted }));
    } catch (err) {
      next(new ApiError(500, 'Error deleting category'));
    }
  }
  async function getCategory(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      if (!category) return next(new ApiError(404, 'Category not found'));
      return res.json(JSend.success({ category }));
    } catch (err) {
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
  updateCategory,
  deleteCategory,
  getCategory,
  deleteAllCategories
}