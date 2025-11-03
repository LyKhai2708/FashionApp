const inventoryService = require('../services/inventory.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

async function getInventoryOverview(req, res, next) {
    try {
        const overview = await inventoryService.getInventoryOverview();
        return res.json(JSend.success({ overview }));
    } catch (error) {
        console.error('Get inventory overview error:', error);
        return next(new ApiError(500, 'Lỗi khi lấy tổng quan tồn kho'));
    }
}

async function getLowStockProducts(req, res, next) {
    try {
        const { page, limit, threshold, categoryId, brandId, search, stockStatus } = req.query;
        const result = await inventoryService.getLowStockProducts({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            threshold: parseInt(threshold) || 10,
            categoryId: categoryId ? parseInt(categoryId) : null,
            brandId: brandId ? parseInt(brandId) : null,
            search: search || null,
            stockStatus: stockStatus || 'all'
        });
        return res.json(JSend.success(result));
    } catch (error) {
        console.error('Get low stock products error:', error);
        return next(new ApiError(500, 'Lỗi khi lấy danh sách sản phẩm sắp hết hàng'));
    }
}

async function adjustStock(req, res, next) {
    try {
        const variantId = parseInt(req.params.variantId);
        const adminId = req.user.id;
        const { quantityChange, reason, notes, actionType } = req.body;

        if (!quantityChange || isNaN(quantityChange) || quantityChange === 0) {
            return next(new ApiError(400, 'Số lượng thay đổi không hợp lệ'));
        }

        if (!reason || reason.trim() === '') {
            return next(new ApiError(400, 'Vui lòng nhập lý do điều chỉnh'));
        }

        const result = await inventoryService.adjustStock(variantId, adminId, {
            quantityChange: parseInt(quantityChange),
            reason,
            notes: notes || null,
            actionType: actionType || 'adjustment'
        });

        return res.json(JSend.success({ 
            result,
            message: 'Điều chỉnh tồn kho thành công'
        }));
    } catch (error) {
        console.error('Adjust stock error:', error);
        return next(new ApiError(500, error.message));
    }
}

async function getStockHistory(req, res, next) {
    try {
        const { page, limit, variantId, productId, actionType, startDate, endDate } = req.query;
        const result = await inventoryService.getStockHistory({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            variantId: variantId ? parseInt(variantId) : null,
            productId: productId ? parseInt(productId) : null,
            actionType: actionType || null,
            startDate: startDate || null,
            endDate: endDate || null
        });
        return res.json(JSend.success(result));
    } catch (error) {
        console.error('Get stock history error:', error);
        return next(new ApiError(500, 'Lỗi khi lấy lịch sử tồn kho'));
    }
}

async function getStockTrend(req, res, next) {
    try {
        const { days = 30 } = req.query;
        const trend = await inventoryService.getStockTrend(parseInt(days));
        return res.json(JSend.success({ trend }));
    } catch (error) {
        console.error('Get stock trend error:', error);
        return next(new ApiError(500, 'Lỗi khi lấy xu hướng tồn kho'));
    }
}

module.exports = {
    getInventoryOverview,
    getLowStockProducts,
    adjustStock,
    getStockHistory,
    getStockTrend
};
