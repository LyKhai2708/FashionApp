const addressService = require('../services/address.service');
const JSend = require('../jsend');
const ApiError = require('../api-error');

/**
 * Get all addresses of current user
 */
async function getUserAddresses(req, res, next) {
    try {
        const userId = req.user.id;
        const addresses = await addressService.getUserAddresses(userId);
        return res.json(JSend.success({ addresses }));
    } catch (error) {
        console.error('Get addresses error:', error);
        return next(new ApiError(500, 'Lỗi khi lấy danh sách địa chỉ'));
    }
}

/**
 * Get default address
 */
async function getDefaultAddress(req, res, next) {
    try {
        const userId = req.user.id;
        const address = await addressService.getDefaultAddress(userId);
        return res.json(JSend.success({ address }));
    } catch (error) {
        console.error('Get default address error:', error);
        return next(new ApiError(500, 'Lỗi khi lấy địa chỉ mặc định'));
    }
}

/**
 * Create new address
 */
async function createAddress(req, res, next) {
    try {
        const userId = req.user.id;
        const { province, province_code, ward, ward_code, detail_address, is_default } = req.body;
        
        if (!province || !province_code || !ward || !ward_code || !detail_address) {
            return next(new ApiError(400, 'Thiếu thông tin địa chỉ'));
        }
        
        const address = await addressService.createAddress(userId, {
            province,
            province_code,
            ward,
            ward_code,
            detail_address,
            is_default
        });
        
        return res.status(201).json(JSend.success({ address }));
    } catch (error) {
        console.error('Create address error:', error);
        return next(new ApiError(500, error.message || 'Lỗi khi tạo địa chỉ'));
    }
}

/**
 * Update address
 */
async function updateAddress(req, res, next) {
    try {
        const userId = req.user.id;
        const addressId = parseInt(req.params.id);
        const { province, province_code, ward, ward_code, detail_address, is_default } = req.body;
        
        const address = await addressService.updateAddress(addressId, userId, {
            province,
            province_code,
            ward,
            ward_code,
            detail_address,
            is_default
        });
        
        return res.json(JSend.success({ address }));
    } catch (error) {
        console.error('Update address error:', error);
        return next(new ApiError(500, error.message || 'Lỗi khi cập nhật địa chỉ'));
    }
}

/**
 * Delete address
 */
async function deleteAddress(req, res, next) {
    try {
        const userId = req.user.id;
        const addressId = parseInt(req.params.id);
        
        await addressService.deleteAddress(addressId, userId);
        
        return res.json(JSend.success({ message: 'Xóa địa chỉ thành công' }));
    } catch (error) {
        console.error('Delete address error:', error);
        return next(new ApiError(500, error.message || 'Lỗi khi xóa địa chỉ'));
    }
}

/**
 * Set default address
 */
async function setDefaultAddress(req, res, next) {
    try {
        const userId = req.user.id;
        const addressId = parseInt(req.params.id);
        
        const address = await addressService.setDefaultAddress(addressId, userId);
        
        return res.json(JSend.success({ address }));
    } catch (error) {
        console.error('Set default address error:', error);
        return next(new ApiError(500, error.message || 'Lỗi khi đặt địa chỉ mặc định'));
    }
}

module.exports = {
    getUserAddresses,
    getDefaultAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
