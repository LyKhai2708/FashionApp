const ApiError = require('../api-error');
const JSend = require('../jsend');
const reviewService = require('../services/review.service');


async function getProductReview(req, res, next) {
    const {productId} = req.params;
    if (!productId) {
        return next(new ApiError(400, "Product ID is required"));
    }
    const { page = 1, limit = 5, sortBy = 'newest', filterRating = 0 } = req.query;
    
    let result = {
        metadata: {
          totalRecords: 0,
          firstPage: 1,
          lastPage: 1,
          page: parseInt(page),
          limit: parseInt(limit),
        },
        reviews: [],
        average_rating: 0,
        total_reviews: 0,
        rating_breakdown: {1:0,2:0,3:0,4:0,5:0}
      };
    try {
        result = await reviewService.getProductReview(productId, parseInt(page), parseInt(limit), sortBy, parseInt(filterRating));
        return res.json(JSend.success({
            metadata: result.metadata,
            reviews: result.reviews,
            average_rating: result.average_rating,
            total_reviews: result.total_reviews,
            rating_breakdown: result.rating_breakdown
        }));
    } catch (err) {
        console.log(err);
        return next(new ApiError(500, "Error fetching reviews"));
    }
}

async function createReview(req, res, next) {
    try {
        const { productId } = req.params;
        const { order_id, rating, comment } = req.body;
        
        const reviewData = {
            product_id: productId,
            order_id,
            rating,
            comment
        };
        
        const review = await reviewService.createProductReview(req.user.id, reviewData);
        return res.status(201).json(JSend.success({ review }));
    } catch (err) {
        console.error('Error creating review:', err);
        return next(new ApiError(500, err.message || "Error creating review"));
    }
}

async function checkReviewed(userId, productId, orderId) {
    try {
        const existingReview = await reviewService.findReviewByUserProductOrder(userId, productId, orderId);
        return existingReview;
    }catch (err) {
        console.error('Error checking existing review:', err);
        return next(new ApiError(500, err.message || "Error checking existing review"));
    }
    
}
async function updateReview(req, res, next) {
    try {
        const { rating, comment } = req.body;
        const reviewData = { rating, comment };
        const isAdmin = req.user.role === 'admin';
        
        const review = await reviewService.updateProductReview(req.params.id, req.user.id, reviewData, isAdmin);
        
        if (review === 0) {
            return next(new ApiError(404, "Review not found or you don't have permission to update it"));
        }
        
        return res.json(JSend.success({ review }));
    } catch (err) {
        console.error('Error updating review:', err);
        return next(new ApiError(500, err.message || "Error updating review"));
    }
}

async function deleteReview(req, res, next) {
    try {
        const isAdmin = req.user.role === 'admin';
        const review = await reviewService.deleteProductReview(req.params.id, req.user.id, isAdmin);
        
        if (review === 0) {
            return next(new ApiError(404, "Review not found or you don't have permission to delete it"));
        }
        
        return res.json(JSend.success({ review }));
    } catch (err) {
        console.error('Error deleting review:', err);
        return next(new ApiError(500, err.message || "Error deleting review"));
    }
}

module.exports = {
    getProductReview,
    createReview,
    updateReview,
    deleteReview,
    checkReviewed
};