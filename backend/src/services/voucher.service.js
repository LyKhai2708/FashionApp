const knex = require('../database/knex');
const Paginator = require('./paginator');

function voucherRepository() {
    return knex('vouchers');
}

function userVoucherRepository() {
    return knex('user_vouchers');
}

function orderVoucherRepository() {
    return knex('order_vouchers');
}

function readVoucher(payload) {
    const voucher = {
        code: payload.code,
        name: payload.name,
        description: payload.description,
        discount_type: payload.discount_type,
        discount_value: payload.discount_value,
        min_order_amount: payload.min_order_amount || 0,
        max_discount_amount: payload.max_discount_amount || null,
        usage_limit: payload.usage_limit || null,
        user_limit: payload.user_limit || 1,
        start_date: payload.start_date,
        end_date: payload.end_date,
        active: payload.active !== undefined ? payload.active : true
    };
    return voucher;
}


async function createVoucher(payload) {
    const voucher = readVoucher(payload);
    const [id] = await voucherRepository().insert(voucher);
    return { voucher_id: id, ...voucher };
}


async function getManyVoucher(payload) {
    const { page = 1, limit = 10, code, name, active, discount_type, start_date, end_date } = payload;
    const paginator = new Paginator(page, limit);
    
    let result = voucherRepository()
        .where((builder) => {
            if (code) {
                builder.whereILike('code', `%${code}%`);
            }
            if (name) {
                builder.whereILike('name', `%${name}%`);
            }
            if (active !== undefined) {
                builder.where('active', active);
            }
            if (discount_type) {
                builder.where('discount_type', discount_type);
            }
            if (start_date) {
                builder.where('start_date', '>=', start_date);
            }
            if (end_date) {
                builder.where('end_date', '<=', end_date);
            }
        })
        .select(
            knex.raw('count(voucher_id) OVER() AS recordCount'),
            'voucher_id',
            'code',
            'name',
            'description',
            'discount_type',
            'discount_value',
            'min_order_amount',
            'max_discount_amount',
            'usage_limit',
            'used_count',
            'user_limit',
            'start_date',
            'end_date',
            'active',
            'created_at',
            'updated_at'
        )
        .orderBy('created_at', 'desc')
        .limit(paginator.limit)
        .offset(paginator.offset);
    
    let totalRecords = 0;
    result = (await result).map((result) => {
        totalRecords = result.recordCount;
        delete result.recordCount;
        return {
            ...result,
            remaining_usage: result.usage_limit ? result.usage_limit - result.used_count : null
        };
    });
    
    return {
        metadata: paginator.getMetadata(totalRecords),
        vouchers: result,
    };
}

/**
 * Lấy voucher theo ID
 */
async function getVoucherById(voucherId) {
    const voucher = await voucherRepository()
        .where('voucher_id', voucherId)
        .first();
        
    if (!voucher) {
        throw new Error('Voucher không tồn tại');
    }
    
    return {
        ...voucher,
        remaining_usage: voucher.usage_limit ? voucher.usage_limit - voucher.used_count : null
    };
}

/**
 * Lấy voucher theo code
 */
async function getVoucherByCode(code) {
    const voucher = await voucherRepository()
        .where('code', code.toUpperCase())
        .first();
        
    if (!voucher) {
        throw new Error('Voucher không tồn tại');
    }
    
    return {
        ...voucher,
        remaining_usage: voucher.usage_limit ? voucher.usage_limit - voucher.used_count : null
    };
}

/**
 * Cập nhật voucher
 */
async function updateVoucher(voucherId, payload) {
    const voucher = readVoucher(payload);
    delete voucher.code; // Không cho phép thay đổi code
    
    const updated = await voucherRepository()
        .where('voucher_id', voucherId)
        .update({
            ...voucher,
            updated_at: knex.fn.now()
        });
        
    if (!updated) {
        throw new Error('Voucher không tồn tại');
    }
    
    return await getVoucherById(voucherId);
}

/**
 * Xóa voucher (soft delete - set active = false)
 */
async function deleteVoucher(voucherId) {
    const voucher = await voucherRepository()
        .where('voucher_id', voucherId)
        .first();
        
    if (!voucher) {
        throw new Error('Voucher không tồn tại');
    }
    
    return voucherRepository()
        .where('voucher_id', voucherId)
        .update({ 
            active: false,
            updated_at: knex.fn.now()
        });
}

/**
 * Kiểm tra voucher có hợp lệ không
 */
async function validateVoucher(code, userId, orderAmount) {
    const voucher = await getVoucherByCode(code);
    const now = new Date();
    
    // Kiểm tra các điều kiện
    if (!voucher.active) {
        throw new Error('Voucher đã hết hiệu lực');
    }
    
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);
    endDate.setHours(23, 59, 59, 999);
    
    if (now < startDate || now > endDate) {
        throw new Error('Voucher không nằm trong thời gian hiệu lực');
    }
    
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        throw new Error('Voucher đã hết lượt sử dụng');
    }
    
    if (orderAmount < voucher.min_order_amount) {
        throw new Error(`Đơn hàng tối thiểu phải đạt ${voucher.min_order_amount.toLocaleString('vi-VN')} VNĐ để sử dụng voucher này`);
    }
    
    // Kiểm tra giới hạn sử dụng per user
    if (userId) {
        const userVoucher = await userVoucherRepository()
            .where('user_id', userId)
            .where('voucher_id', voucher.voucher_id)
            .first();
            
        if (userVoucher && userVoucher.used_count >= voucher.user_limit) {
            throw new Error(`Bạn đã sử dụng voucher này quá số lần cho phép (${voucher.user_limit} lần)`);
        }
    }
    
    return voucher;
}

/**
 * Tính toán số tiền giảm giá của voucher
 */
function calculateVoucherDiscount(voucher, orderAmount, shippingFee = 0) {
    let discountAmount = 0;
    
    switch (voucher.discount_type) {
        case 'percentage':
            discountAmount = orderAmount * (voucher.discount_value / 100);
            if (voucher.max_discount_amount && discountAmount > voucher.max_discount_amount) {
                discountAmount = voucher.max_discount_amount;
            }
            break;
            
        case 'fixed_amount':
            discountAmount = voucher.discount_value;
            if (discountAmount > orderAmount) {
                discountAmount = orderAmount;
            }
            break;
            
        case 'free_shipping':
            discountAmount = shippingFee;
            break;
    }
    
    return Math.round(discountAmount);
}

/**
 * Sử dụng voucher (tăng used_count)
 */
async function useVoucher(voucherId, userId, orderId, discountAmount) {
    return await knex.transaction(async (trx) => {
        // Tăng used_count trong vouchers table
        await trx('vouchers')
            .where('voucher_id', voucherId)
            .increment('used_count', 1);
        
        // Cập nhật hoặc tạo user_voucher record
        const userVoucher = await trx('user_vouchers')
            .where('user_id', userId)
            .where('voucher_id', voucherId)
            .first();
            
        if (userVoucher) {
            await trx('user_vouchers')
                .where('user_voucher_id', userVoucher.user_voucher_id)
                .update({
                    used_count: userVoucher.used_count + 1,
                    last_used_at: knex.fn.now()
                });
        } else {
            await trx('user_vouchers').insert({
                user_id: userId,
                voucher_id: voucherId,
                used_count: 1,
                first_used_at: knex.fn.now(),
                last_used_at: knex.fn.now()
            });
        }
        
        // Thêm vào order_vouchers
        await trx('order_vouchers').insert({
            order_id: orderId,
            voucher_id: voucherId,
            discount_amount: discountAmount
        });
    });
}

/**
 * Lấy danh sách vouchers có sẵn cho user
 */
async function getAvailableVouchers(userId, orderAmount) {
    const now = new Date();
    
    let query = voucherRepository()
        .where('active', true)
        .where('start_date', '<=', now.toISOString().split('T')[0])
        .where('end_date', '>=', now.toISOString().split('T')[0])
        .where((builder) => {
            builder.whereNull('usage_limit')
                  .orWhereRaw('used_count < usage_limit');
        });
    
    // Nếu có orderAmount, lọc theo điều kiện min_order_amount
    if (orderAmount) {
        query = query.where('min_order_amount', '<=', orderAmount);
    }
    
    const vouchers = await query.select('*');
    
    // Kiểm tra giới hạn sử dụng per user
    const availableVouchers = [];
    for (const voucher of vouchers) {
        if (userId) {
            const userVoucher = await userVoucherRepository()
                .where('user_id', userId)
                .where('voucher_id', voucher.voucher_id)
                .first();
                
            if (!userVoucher || userVoucher.used_count < voucher.user_limit) {
                availableVouchers.push({
                    ...voucher,
                    remaining_usage: voucher.usage_limit ? voucher.usage_limit - voucher.used_count : null,
                    user_remaining_usage: voucher.user_limit - (userVoucher ? userVoucher.used_count : 0)
                });
            }
        } else {
            availableVouchers.push({
                ...voucher,
                remaining_usage: voucher.usage_limit ? voucher.usage_limit - voucher.used_count : null,
                user_remaining_usage: voucher.user_limit
            });
        }
    }
    
    return availableVouchers;
}

/**
 * Tự động deactivate các voucher đã hết hạn
 */
async function autoDeactivateExpiredVouchers() {
    await voucherRepository()
        .where('active', true)
        .whereRaw('end_date < CURDATE()')
        .update({ 
            active: false,
            updated_at: knex.fn.now()
        });
}

/**
 * Lấy lịch sử sử dụng voucher của user
 */
async function getUserVoucherHistory(userId, page = 1, limit = 10) {
    const paginator = new Paginator(page, limit);
    
    const result = await knex('user_vouchers as uv')
        .join('vouchers as v', 'uv.voucher_id', 'v.voucher_id')
        .where('uv.user_id', userId)
        .where('uv.used_count', '>', 0)
        .select(
            knex.raw('count(uv.user_voucher_id) OVER() AS recordCount'),
            'v.voucher_id',
            'v.code',
            'v.name',
            'v.description',
            'v.discount_type',
            'v.discount_value',
            'uv.used_count',
            'uv.first_used_at',
            'uv.last_used_at'
        )
        .orderBy('uv.last_used_at', 'desc')
        .limit(paginator.limit)
        .offset(paginator.offset);
    
    let totalRecords = 0;
    const vouchers = result.map((item) => {
        totalRecords = item.recordCount;
        delete item.recordCount;
        return item;
    });
    
    return {
        metadata: paginator.getMetadata(totalRecords),
        vouchers: vouchers
    };
}

module.exports = {
    createVoucher,
    getManyVoucher,
    getVoucherById,
    getVoucherByCode,
    updateVoucher,
    deleteVoucher,
    validateVoucher,
    calculateVoucherDiscount,
    useVoucher,
    getAvailableVouchers,
    autoDeactivateExpiredVouchers,
    getUserVoucherHistory
};