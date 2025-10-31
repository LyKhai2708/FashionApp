const express = require('express');
const router = express.Router();
const bannersController = require('../controllers/banners.controller');
const { methodNotAllowed } = require('../controllers/errors.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload_image.middleware');

module.exports.setup = (app) => {
    app.use('/api/v1/banners', router);
    
    router.get('/public', bannersController.getActiveBanners);
    
    router.get('/', 
        authMiddleware, 
        authorizeRoles('admin'),
        bannersController.getBannersbyFilter
    );
    
    router.get('/:id',
        authMiddleware,
        authorizeRoles('admin'),
        bannersController.getBannerById
    );
    
    router.post('/',
        authMiddleware,
        authorizeRoles('admin'),
        uploadSingle('image'),
        bannersController.createBanner
    );
    
    router.put('/:id',
        authMiddleware,
        authorizeRoles('admin'),
        uploadSingle('image'),
        bannersController.updateBanner
    );
    
    router.delete('/:id',
        authMiddleware,
        authorizeRoles('admin'),
        bannersController.deleteBanner
    );
    
    router.all('/', methodNotAllowed);
};
