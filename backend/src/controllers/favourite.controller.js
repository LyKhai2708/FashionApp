const favouriteService = require('../services/favourite.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

async function getFavorites(req, res, next) {
    console.log('user_id', req.user.id);
    const user_id = req.user.id;
    let result = {
        metadata: {
          totalRecords: 0,
          firstPage: 1,
          lastPage: 1,
          page: 1,
          limit: 5,
        },
        favorites: []
      };
    try {
        result = await favouriteService.getFavorites(user_id,req.query);
        return res.json(JSend.success({
            metadata: result.metadata,
            favorites: result.favorites
        }));
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error fetching favorites"));
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
