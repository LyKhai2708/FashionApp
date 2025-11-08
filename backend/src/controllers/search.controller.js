const ApiError = require('../api-error');
const searchService = require('../services/search.service');
const JSend = require('../jsend');

async function saveSearch(req, res, next) {
    try {
        const { keyword } = req.body;
        
        if (!keyword || typeof keyword !== 'string') {
            return next(new ApiError(400, 'Keyword là bắt buộc và phải là chuỗi ký tự'));
        }
        
        const userId = req.user ? req.user.id : null;
        
        await searchService.saveSearchKeyword(keyword, userId);
        
        return res.status(201).json(JSend.success({ message: 'Đã lưu từ khóa tìm kiếm' }));
    } catch (error) {
        console.error('Error saving search keyword:', error);
        return next(new ApiError(500, 'Đã xảy ra lỗi khi lưu từ khóa tìm kiếm'));
    }
}

async function getTrendingKeywords(req, res, next) {
    try {
        const limit = parseInt(req.query.limit) || 6;
        
        const keywords = await searchService.getTrendingKeywords(limit);
        
        return res.json(JSend.success({ keywords }));
    } catch (error) {
        console.error('Error getting trending keywords:', error);
        return next(new ApiError(500, 'Đã xảy ra lỗi khi lấy từ khóa nổi bật'));
    }
}

module.exports = {
    saveSearch,
    getTrendingKeywords,
};