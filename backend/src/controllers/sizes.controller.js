const ApiError = require('../api-error');
const sizeService = require('../services/sizes.service');
const JSend = require('../jsend');



async function createSize(req, res, next) {
  const { name } = req.body;
  
  if (!req.body?.name || typeof req.body.name !== 'string') {
    return next(new ApiError(400, 'Color name should be a non-empty string'));
  }
  try {
    const existingSize = await sizeService.getSizeByName(name);

    if (existingSize) {
      return next(new ApiError(409, 'Size already exists'));
    }

    const size = await sizeService.createSize({
      ...req.body
    });

    return res
      .status(201)
      .set({ Location: `${req.baseUrl}/${size.size_id}` })
      .json(JSend.success({ size }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'An error occurred while creating the size'));
  }
}

async function getSizesByFilter(req, res, next) {
  let result = {
    sizes: [],
    metadata: {
      totalReconds: 0,
      firstPage: 1,
      lastPage: 1,
      page: 1,
      limit: 100,
    }
  }

  try {
    result = await sizeService.getManySizes(req.query);
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'An error occurred while fetching sizes'));
  }
  return res.json(
    JSend.success({
      sizes: result.sizes,
      metadata: result.metadata,
    })
  );
}

async function getSize(req, res, next) {
  const { id } = req.params;
  console.log(req.params);
  try {
    const size = await sizeService.getSizeById(id);
    if (!size) {
      return next(new ApiError(404, 'Size not found'));
    }

    return res.json(JSend.success({ size }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, `Error retrieving Size with id=${id}`));
  }
}

async function updateSize(req, res, next) {
  const {size_id} = req.params;
  const {name} = req.body;

  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, 'Data for update cannot be empty'));
  }

  try {
    const existingSize = await sizeService.getSizeByName(name, size_id);

    if (existingSize) {
      return next(new ApiError(409, 'Size already exists'));
    }
    const updatedSize = await sizeService.updateSize(size_id, req.body);

    if (!updatedSize) {
      return next(new ApiError(404, 'Size not found'));
    }
    

    return res.json(JSend.success({ size: updatedSize }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, `Error updating Size with id=${size_id}`));
  }
}

async function deleteSize(req, res, next) {
  const { size_id } = req.params;

  try {
    const deletedSize = await sizeService.deleteSize(size_id);

    if (!deletedSize) {
      return next(new ApiError(404, 'Size not found'));
    }

    return res.json(JSend.success());
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, `Could not delete Size with id=${size_id}`));
  }
}

async function deleteAllSizes(req, res, next) {
  try {
    await sizeService.deleteAllSizes();
    return res.json(JSend.success());
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'An error occurred while removing all Sizes'));
  }
}

module.exports = {
    
  createSize,
  getSizesByFilter,
  getSize,
  updateSize,
  deleteSize,
  deleteAllSizes,
};