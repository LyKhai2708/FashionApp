const supplierService = require('../services/supplier.service');
const JSend = require('../jsend');
const ApiError = require('../api-error');

async function createSupplier(req, res, next) {
    try {
        if (!req.body.name) {
            return next(new ApiError(400, 'Tên nhà cung cấp là bắt buộc'));
        }
        const supplier = await supplierService.createSupplier(req.body);
        return res.json(JSend.success({ supplier }));
    } catch (error) {
        console.error('Error creating supplier:', error);
        return next(new ApiError(500, 'Lỗi khi tạo nhà cung cấp'));
    }
}

async function getSuppliers(req, res, next) {
    try {
        const { page, limit, search } = req.query;
        const result = await supplierService.getSuppliers(page, limit, search);
        return res.json(JSend.success(result));
    } catch (error) {
        console.error('Error getting suppliers:', error);
        return next(new ApiError(500, 'Lỗi khi lấy danh sách nhà cung cấp'));
    }
}

async function getSupplierById(req, res, next) {
    try {
        const { id } = req.params;
        const supplier = await supplierService.getSupplierById(id);
        if (!supplier) {
            return next(new ApiError(404, 'Không tìm thấy nhà cung cấp'));
        }
        return res.json(JSend.success({ supplier }));
    } catch (error) {
        console.error('Error getting supplier:', error);
        return next(new ApiError(500, 'Lỗi khi lấy thông tin nhà cung cấp'));
    }
}

async function updateSupplier(req, res, next) {
    try {
        const { id } = req.params;
        const supplier = await supplierService.getSupplierById(id);
        if (!supplier) {
            return next(new ApiError(404, 'Không tìm thấy nhà cung cấp'));
        }
        const updatedSupplier = await supplierService.updateSupplier(id, req.body);
        return res.json(JSend.success({ supplier: updatedSupplier }));
    } catch (error) {
        console.error('Error updating supplier:', error);
        return next(new ApiError(500, 'Lỗi khi cập nhật nhà cung cấp'));
    }
}

async function deleteSupplier(req, res, next) {
    try {
        const { id } = req.params;
        const supplier = await supplierService.getSupplierById(id);
        if (!supplier) {
            return next(new ApiError(404, 'Không tìm thấy nhà cung cấp'));
        }
        await supplierService.deleteSupplier(id);
        return res.json(JSend.success({ message: 'Xóa nhà cung cấp thành công' }));
    } catch (error) {
        console.error('Error deleting supplier:', error);
        return next(new ApiError(500, 'Lỗi khi xóa nhà cung cấp'));
    }
}

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
