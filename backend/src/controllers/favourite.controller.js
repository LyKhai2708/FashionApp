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
        const deleted = await favouriteService.deleteFavorite(req.user.id, req.params.product_id);
        return res.json(JSend.success({ message: "Favorite deleted" }));
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error deleting favorite"));
    }
}

async function addFavorite(req, res, next) {
    try {
        const added = await favouriteService.addFavorite(req.user.id, req.params.product_id);
        return res.json(JSend.success({ message: "Favorite added" }));
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
