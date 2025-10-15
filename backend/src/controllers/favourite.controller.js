const favouriteService = require('../services/favourite.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

async function getFavorites(req, res, next) {
    const user_id = req.user.id;
    const role = req.user?.role || null;
    let result = {
        metadata: {
          totalRecords: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        favorites: []
      };
    try {
        result = await favouriteService.getFavorites(user_id, req.query, role);
        return res.json(JSend.success({
            metadata: result.metadata,
            favorites: result.favorites
        }));
    } catch (error) {
        console.error('Error getting favorites:', error);
        return next(new ApiError(500, 'Lỗi khi lấy danh sách yêu thích'));
    }
}

async function deleteFavorite(req, res, next) {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, "Favorite ID is required"));
        }
        
        const deleted = await favouriteService.deleteFavoriteById(req.user.id, req.params.id);
        return res.json(JSend.success({ message: "Favorite deleted" }));
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error deleting favorite"));
    }
}

async function addFavorite(req, res, next) {
    try {
        const productId = req.body.product_id;
        
        if (!productId) {
            return next(new ApiError(400, "Product ID is required"));
        }
        
        const added = await favouriteService.addFavorite(req.user.id, productId);
        return res.json(JSend.success({ favorite: added }));
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error adding favorite"));
    }
}

module.exports = {
    getFavorites,
    deleteFavorite,
    addFavorite
};
