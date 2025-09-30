const imagesService = require('../services/images.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

async function getImages(req, res, next) {
  try {
    const images = await imagesService.getImages(req.query);
    return res.json(JSend.success({ images }));
  } catch (err) {
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
      return next(new ApiError(400, 'Image file or image_url is required'));
    }
    const { product_variants_id } = req.body;
    const image = await imagesService.addImage({ product_variants_id, image_url });
    return res.status(201).json(JSend.success({ image }));
  } catch (err) {
    return next(new ApiError(400, err.message || 'Error adding image'));
  }
}

async function removeImage(req, res, next) {
  try {
    const removed = await imagesService.removeImage(req.params.id);
    if (!removed) return next(new ApiError(404, 'Image not found'));
    return res.json(JSend.success({ message: 'Image removed' }));
  } catch (err) {
    return next(new ApiError(500, 'Error removing image'));
  }
}

module.exports = {
  getImages,
  addImage,
  removeImage,
};
