const ApiError = require('../api-error')
const brandService = require('../services/brand.service');
const JSend = require('../jsend');

async function createBrand(req, res, next) {
  const {name, active}  = req.body;
  if(!name || typeof name !== 'string') {
    return next(new ApiError(400, 'Brand name should be non-empty string'));
  }
  const checkName = await brandService.checkBrandName(name);
  if(checkName){
    return next(new ApiError(409, 'Brand name already exists'));
  }
  try{
    const brand = await brandService.createBrand({...req.body});
    return res
    .status(201)
    .set({
        Location: `${req.baseUrl}/${brand.id}`
    })
    .json(JSend.success({brand}));
  }catch(error){
    console.log(error);
    return (next(new ApiError(500, 'An error occurred while creating brand')));
  }
}
async function getBrandbyFilter(req, res, next) {
    let result = {
      metadata: {
        totalRecords: 0,
        firstPage: 1,
        lastPage: 1,
        page: 1,
        limit: 5,
      },
      brands: []
    };
  try {
    result = await brandService.getManyBrands(req.query);

  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'Internal server error'));
  }
  return res.json(JSend.success({
    metadata: result.metadata,
    brands: result.brands
  }));
}

async function getBrand(req, res, next) {
  const {id} = req.params;
  try {
    const brand = await brandService.getBrandById(id);
    if (!brand) {
      return next(new ApiError(404, 'Brand not found'));
    }
    return res.json(JSend.success({brand}));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, `Error retrieving brand with id=${id}`));
  }
}

async function updateBrand(req, res, next) {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, 'Data for update cannot be empty'));
  }
  const {id} = req.params;
  try {
    const updated = await brandService.updateBrand(id, req.body);
    if (!updated) {
      return next(new ApiError(404, 'Brand not found'));
    }
    return res.json(JSend.success({brand: updated}));
  } catch (error) {
    console.log(error);
    if (error.code === "ER_DUP_ENTRY") {
      return next(new ApiError(409, "Brand name already exists"));
    }
    return next(new ApiError(500, `An error occurred while updating brand with id ${id}`));
  }
}

async function deleteBrand(req, res, next) {
  const {id} = req.params;
  try {
    const deleted = await brandService.deleteBrand(id);
    if (!deleted) {
      return next(new ApiError(404, 'Brand not found'));
    }
    return res.json(JSend.success({ deleted: true }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, `An error occurred while removing brand with id ${id}`));
  }
}

async function deleteAllBrands(req, res, next) {
  try {
    const deleted = await brandService.deleteAllBrands();
    return res.json(JSend.success({ deleted: true }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'An error occurred while removing all brand'));
  }
}

module.exports = {
  createBrand,
  getBrandbyFilter,
  getBrand,
  updateBrand,
  deleteBrand,
  deleteAllBrands,
};