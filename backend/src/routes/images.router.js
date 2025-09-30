const express = require('express');
const router = express.Router();
const imagesController = require('../controllers/images.controller');
const { methodNotAllowed } = require('../controllers/errors.controller');
const { uploadSingle } = require('../middleware/upload_image.middleware');
module.exports.setup = (app) => {
    app.use('/api/v1/images', router);
    router.get('/', imagesController.getImages); // Lấy danh sách images
    router.post('/', uploadSingle('imageFile'), imagesController.addImage); // Thêm image mới
    router.delete('/:id', imagesController.removeImage); // Xoá image
    router.all('/', methodNotAllowed);
    router.all('/:id', methodNotAllowed);
};
