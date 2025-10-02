const colorsService = require('../services/colors.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

async function createColor(req, res, next) {
  const { name } = req.body;
  
  if (!req.body?.name || typeof req.body.name !== 'string') {
    return next(new ApiError(400, 'Color name should be a non-empty string'));
  }
  try {
    const existingColor = await colorsService.getColorByName(name);

    if (existingColor) {
      return next(new ApiError(409, 'Color already exists'));
    }

    const color = await colorsService.createColor({
      ...req.body
    });

    return res
      .status(201)
      .set({ Location: `${req.baseUrl}/${color.color_id}` })
      .json(JSend.success({ color }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'An error occurred while creating the color'));
  }
}

async function getColorsByFilter(req, res, next) {
  let result = {
    colors: [],
    metadata: {
      totalReconds: 0,
      firstPage: 1,
      lastPage: 1,
      page: 1,
      limit: 5,
    }
  }

  try {
    result = await colorsService.getManyColors(req.query);
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'An error occurred while fetching colors'));
  }
  return res.json(
    JSend.success({
      colors: result.colors,
      metadata: result.metadata,
    })
  );
}

async function getColor(req, res, next) {
  const { id } = req.params;
  console.log(req.params);
  try {
    const color = await colorsService.getColorById(id);
    if (!color) {
      return next(new ApiError(404, 'Color not found'));
    }

    return res.json(JSend.success({ color }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, `Error retrieving Color with id=${id}`));
  }
}

async function updateColor(req, res, next) {
  const {id: color_id} = req.params;
  const {name} = req.body;

  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, 'Data for update cannot be empty'));
  }

  try {
    const existingColor = await colorsService.getColorByName(name, color_id);

    if (existingColor) {
      return next(new ApiError(409, 'Color already exists'));
    }
    const updatedColor = await colorsService.updateColor(color_id, req.body);

    if (!updatedColor) {
      return next(new ApiError(404, 'Color not found'));
    }
    

    return res.json(JSend.success({ color: updatedColor }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, `Error updating Color with id=${color_id}`));
  }
}

async function deleteColor(req, res, next) {
  const { id: color_id } = req.params;

  try {
    const deletedColor = await colorsService.deleteColor(color_id);

    if (!deletedColor) {
      return next(new ApiError(404, 'Color not found'));
    }

    return res.json(JSend.success());
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, `Could not delete Color with id=${color_id}`));
  }
}

async function deleteAllColors(req, res, next) {
  try {
    await colorsService.deleteAllColors();
    return res.json(JSend.success());
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'An error occurred while removing all Colors'));
  }
}

module.exports = {
    
  createColor,
  getColorsByFilter,
  getColor,
  updateColor,
  deleteColor,
  deleteAllColors,
};