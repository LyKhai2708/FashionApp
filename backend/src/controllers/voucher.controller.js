const voucherService = require('../services/voucher.service');
const ApiError = require('../api-error');


const getVouchers = async (req, res, next) => {
    try {
        const { page, limit, code, name, active, discount_type, start_date, end_date } = req.query;

        const result = await voucherService.getManyVoucher({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            code,
            name,
            active: active !== undefined ? active === 'true' : undefined,
            discount_type,
            start_date,
            end_date
        });

        res.status(200).json({
            status: 'success',
            data: result,
            message: 'Lấy danh sách voucher thành công'
        });
    } catch (error) {
        next(error);
    }
};


const getVoucherById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const voucher = await voucherService.getVoucherById(parseInt(id));

        res.status(200).json({
            status: 'success',
            data: { voucher },
            message: 'Lấy thông tin voucher thành công'
        });
    } catch (error) {
        next(error);
    }
};


const createVoucher = async (req, res, next) => {
    try {
        // Validation
        if (!req.body?.code || typeof req.body.code !== 'string') {
            return next(new ApiError(400, 'Mã voucher là bắt buộc và phải là chuỗi ký tự'));
        }

        if (!req.body?.name || typeof req.body.name !== 'string') {
            return next(new ApiError(400, 'Tên voucher là bắt buộc và phải là chuỗi ký tự'));
        }

        if (!req.body?.discount_type || !['percentage', 'fixed_amount', 'free_shipping'].includes(req.body.discount_type)) {
            return next(new ApiError(400, 'Loại giảm giá không hợp lệ'));
        }

        if (req.body.discount_type !== 'free_shipping') {
            if (!req.body?.discount_value || typeof req.body.discount_value !== 'number' || req.body.discount_value <= 0) {
                return next(new ApiError(400, 'Giá trị giảm giá là bắt buộc và phải lớn hơn 0'));
            }
        }

        if (req.body.discount_type === 'percentage' && (req.body.discount_value < 0 || req.body.discount_value > 100)) {
            return next(new ApiError(400, 'Giảm giá phần trăm phải nằm trong khoảng 0-100'));
        }

        if (!req.body?.start_date || !req.body?.end_date) {
            return next(new ApiError(400, 'Ngày bắt đầu và ngày kết thúc là bắt buộc'));
        }

        const voucherData = {
            code: req.body.code.toUpperCase(),
            name: req.body.name,
            description: req.body.description || null,
            discount_type: req.body.discount_type,
            discount_value: req.body.discount_type === 'free_shipping' ? 0 : req.body.discount_value,
            min_order_amount: req.body.min_order_amount || 0,
            max_discount_amount: req.body.max_discount_amount || null,
            usage_limit: req.body.usage_limit || null,
            user_limit: req.body.user_limit || 1,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            active: req.body.active !== undefined ? req.body.active : true
        };

        const voucher = await voucherService.createVoucher(voucherData);

        res.status(201).json({
            status: 'success',
            data: { voucher },
            message: 'Tạo voucher thành công'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return next(new ApiError(400, 'Mã voucher đã tồn tại'));
        }
        next(error);
    }
};


const updateVoucher = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validation
        if (req.body.discount_type && !['percentage', 'fixed_amount', 'free_shipping'].includes(req.body.discount_type)) {
            return next(new ApiError(400, 'Loại giảm giá không hợp lệ'));
        }

        if (req.body.discount_value !== undefined && (typeof req.body.discount_value !== 'number' || req.body.discount_value <= 0)) {
            return next(new ApiError(400, 'Giá trị giảm giá phải lớn hơn 0'));
        }

        if (req.body.discount_type === 'percentage' && req.body.discount_value && (req.body.discount_value < 0 || req.body.discount_value > 100)) {
            return next(new ApiError(400, 'Giảm giá phần trăm phải nằm trong khoảng 0-100'));
        }

        const voucherData = {
            name: req.body.name,
            description: req.body.description,
            discount_type: req.body.discount_type,
            discount_value: req.body.discount_value,
            min_order_amount: req.body.min_order_amount,
            max_discount_amount: req.body.max_discount_amount,
            usage_limit: req.body.usage_limit,
            user_limit: req.body.user_limit,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            active: req.body.active
        };

        // Remove undefined values
        Object.keys(voucherData).forEach(key => voucherData[key] === undefined && delete voucherData[key]);

        const voucher = await voucherService.updateVoucher(parseInt(id), voucherData);

        res.status(200).json({
            status: 'success',
            data: { voucher },
            message: 'Cập nhật voucher thành công'
        });
    } catch (error) {
        next(error);
    }
};


const deleteVoucher = async (req, res, next) => {
    try {
        const { id } = req.params;

        await voucherService.deleteVoucher(parseInt(id));

        res.status(200).json({
            status: 'success',
            data: { success: true },
            message: 'Xóa voucher thành công'
        });
    } catch (error) {
        if (error.message && error.message.includes('đã được sử dụng')) {
            return next(new ApiError(400, error.message));
        }
        next(error);
    }
};


const toggleVoucherActive = async (req, res, next) => {
    try {
        const { id } = req.params;

        const voucher = await voucherService.toggleVoucherActive(parseInt(id));

        res.status(200).json({
            status: 'success',
            data: { voucher },
            message: voucher.active ? 'Đã kích hoạt voucher' : 'Đã vô hiệu hóa voucher'
        });
    } catch (error) {
        next(error);
    }
};


const getAvailableVouchers = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { order_amount } = req.query;

        const vouchers = await voucherService.getAvailableVouchers(
            userId,
            order_amount ? parseFloat(order_amount) : null
        );

        res.status(200).json({
            status: 'success',
            data: { vouchers },
            message: 'Lấy danh sách voucher có sẵn thành công'
        });
    } catch (error) {
        next(error);
    }
};


const validateVoucher = async (req, res, next) => {
    try {
        const { code } = req.params;
        const userId = req.user?.id;
        const { order_amount, shipping_fee = 0 } = req.body;

        if (!order_amount || typeof order_amount !== 'number' || order_amount <= 0) {
            return next(new ApiError(400, 'Tổng đơn hàng phải lớn hơn 0'));
        }

        // Validate voucher
        const voucher = await voucherService.validateVoucher(code, userId, order_amount);

        // Calculate discount
        const discountAmount = voucherService.calculateVoucherDiscount(voucher, order_amount, shipping_fee);

        const finalAmount = order_amount - discountAmount;

        res.status(200).json({
            status: 'success',
            data: {
                voucher: {
                    voucher_id: voucher.voucher_id,
                    code: voucher.code,
                    name: voucher.name,
                    description: voucher.description,
                    discount_type: voucher.discount_type,
                    discount_value: voucher.discount_value,
                    discount_amount: discountAmount
                },
                order_summary: {
                    original_amount: order_amount,
                    discount_amount: discountAmount,
                    final_amount: finalAmount,
                    shipping_fee: shipping_fee
                }
            },
            message: 'Voucher hợp lệ'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Lấy lịch sử sử dụng voucher của user
 */
const getUserVoucherHistory = async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { page = 1, limit = 10 } = req.query;

        if (!userId) {
            return next(new ApiError(401, 'Bạn cần đăng nhập để xem lịch sử voucher'));
        }

        const result = await voucherService.getUserVoucherHistory(
            userId,
            parseInt(page),
            parseInt(limit)
        );

        res.status(200).json({
            status: 'success',
            data: result,
            message: 'Lấy lịch sử sử dụng voucher thành công'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVouchers,
    getVoucherById,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    toggleVoucherActive,
    getAvailableVouchers,
    validateVoucher,
    getUserVoucherHistory
};