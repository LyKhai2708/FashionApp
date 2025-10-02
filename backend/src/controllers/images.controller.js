const imagesService = require('../services/images.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

async function getImages(req, res, next) {
  try {
    const result = await imagesService.getManyImages(req.query);
    return res.json(JSend.success({ 
      images: result.images,
      metadata: result.metadata 
    }));
  } catch (err) {
    console.error('Error fetching images:', err);
    return next(new ApiError(500, 'Error fetching images'));
  }
}

async function addImage(req, res, next) {
  try {
    let image_url = null;
    if (req.file) {
      image_url = `/public/uploads/${req.file.filename}`;
    }
    if (!image_url) {
      return next(new ApiError(400, 'Image file is required'));
    }
    const { product_color_id } = req.body;
    if (!product_color_id) {
      return next(new ApiError(400, 'product_color_id is required'));
    }
    const image = await imagesService.addImage({ product_color_id, image_url });
    return res.status(201).json(JSend.success({ image }));
  } catch (err) {
    console.error('Error adding image:', err);
    return next(new ApiError(400, err.message || 'Error adding image'));
  }
}

async function removeImage(req, res, next) {
  try {
    const imageId = parseInt(req.params.id);
    if (!imageId) {
      return next(new ApiError(400, 'Invalid image ID'));
    }
    const removed = await imagesService.removeImage(imageId);
    if (!removed) return next(new ApiError(404, 'Image not found'));
    return res.json(JSend.success({ 
      message: 'Image removed successfully',
      image: removed 
    }));
  } catch (err) {
    console.error('Error removing image:', err);
    return next(new ApiError(500, 'Error removing image'));
  }
}

module.exports = {
  getImages,
  addImage,
  removeImage,
};
