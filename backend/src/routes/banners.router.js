const express = require('express');
const router = express.Router();
const bannersController = require('../controllers/banners.controller');
const { methodNotAllowed } = require('../controllers/errors.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');
const { uploadSingle } = require('../middleware/upload_image.middleware');

module.exports.setup = (app) => {
    app.use('/api/v1/banners', router);

    router.get('/public', bannersController.getActiveBanners);

    router.get('/',
        authMiddleware,
        checkPermission,
        bannersController.getBannersbyFilter
    );

    router.get('/:id',
        authMiddleware,
        checkPermission,
        bannersController.getBannerById
    );

    router.post('/',
        authMiddleware,
        checkPermission,
        uploadSingle('image'),
        bannersController.createBanner
    );

    router.put('/:id',
        authMiddleware,
        checkPermission,
        uploadSingle('image'),
        bannersController.updateBanner
    );

    router.delete('/:id',
        authMiddleware,
        checkPermission,
        bannersController.deleteBanner
    );

    router.all('/', methodNotAllowed);
};
