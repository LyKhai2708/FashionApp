const express = require('express');
const colorsController = require('../controllers/colors.controller');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/colors', router);
    router.get('/', colorsController.getColorsByFilter);
    router.post('/', colorsController.createColor);
    router.delete('/', colorsController.deleteAllColors);
    router.all('/', methodNotAllowed);
    router.get('/:color_id', colorsController.getColor);
    router.put('/:color_id', colorsController.updateColor);
    router.delete('/:color_id', colorsController.deleteColor);
    router.all('/:color_id', methodNotAllowed);
}