const purchaseOrderService = require('../services/purchase-order.service');
const JSend = require('../jsend');
const ApiError = require('../api-error');

async function createPurchaseOrder(req, res, next) {
    try {
        const userId = req.user.id;
        const order = await purchaseOrderService.createPurchaseOrder(userId, req.body);
        return res.json(JSend.success({ order }));
    } catch (error) {
        console.error('Error creating purchase order:', error);
        return next(new ApiError(500, error.message || 'Lỗi khi tạo phiếu nhập'));
    }
}

async function getPurchaseOrders(req, res, next) {
    try {
        const { page, limit, status, supplier_id } = req.query;
        const result = await purchaseOrderService.getPurchaseOrders(page, limit, status, supplier_id);
        return res.json(JSend.success(result));
    } catch (error) {
        console.error('Error getting purchase orders:', error);
        return next(new ApiError(500, 'Lỗi khi lấy danh sách phiếu nhập'));
    }
}

async function getPurchaseOrderById(req, res, next) {
    try {
        const { id } = req.params;
        const order = await purchaseOrderService.getPurchaseOrderById(id);
        if (!order) {
            return next(new ApiError(404, 'Không tìm thấy phiếu nhập'));
        }
        return res.json(JSend.success({ order }));
    } catch (error) {
        console.error('Error getting purchase order:', error);
        return next(new ApiError(500, 'Lỗi khi lấy thông tin phiếu nhập'));
    }
}

async function updateStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        if (!['completed', 'cancelled'].includes(status)) {
            return next(new ApiError(400, 'Trạng thái không hợp lệ'));
        }

        await purchaseOrderService.updatePurchaseOrderStatus(id, status, userId);
        return res.json(JSend.success({ message: 'Cập nhật trạng thái thành công' }));
    } catch (error) {
        console.error('Error updating purchase order status:', error);
        return next(new ApiError(400, error.message || 'Lỗi khi cập nhật trạng thái'));
    }
}

async function deletePurchaseOrder(req, res, next) {
    try {
        const { id } = req.params;
        await purchaseOrderService.deletePurchaseOrder(id);
        return res.json(JSend.success({ message: 'Xóa phiếu nhập thành công' }));
    } catch (error) {
        console.error('Error deleting purchase order:', error);
        return next(new ApiError(400, error.message || 'Lỗi khi xóa phiếu nhập'));
    }
}

module.exports = {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updateStatus,
    deletePurchaseOrder
};
