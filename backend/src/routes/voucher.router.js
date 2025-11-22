const voucherController = require('../controllers/voucher.controller');
const express = require('express');
const router = express.Router();
const { methodNotAllowed } = require('../controllers/errors.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Voucher:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - discount_type
 *         - discount_value
 *         - start_date
 *         - end_date
 *       properties:
 *         voucher_id:
 *           type: integer
 *           description: Voucher ID
 *           example: 1
 *         code:
 *           type: string
 *           description: Mã voucher
 *           example: "SUMMER20"
 *         name:
 *           type: string
 *           description: Tên voucher
 *           example: "Khuyến mãi mùa hè"
 *         description:
 *           type: string
 *           description: Mô tả voucher
 *           example: "Giảm 20% cho đơn hàng từ 500k"
 *         discount_type:
 *           type: string
 *           enum: [percentage, fixed_amount, free_shipping]
 *           description: Loại giảm giá
 *           example: "percentage"
 *         discount_value:
 *           type: number
 *           description: Giá trị giảm giá
 *           example: 20
 *         min_order_amount:
 *           type: number
 *           description: Giá trị đơn hàng tối thiểu
 *           example: 500000
 *         max_discount_amount:
 *           type: number
 *           description: Giá trị giảm giá tối đa
 *           example: 100000
 *         usage_limit:
 *           type: integer
 *           description: Giới hạn sử dụng
 *           example: 100
 *         used_count:
 *           type: integer
 *           description: Số lần đã sử dụng
 *           example: 25
 *         user_limit:
 *           type: integer
 *           description: Giới hạn sử dụng per user
 *           example: 2
 *         start_date:
 *           type: string
 *           format: date
 *           description: Ngày bắt đầu
 *           example: "2024-06-01"
 *         end_date:
 *           type: string
 *           format: date
 *           description: Ngày kết thúc
 *           example: "2024-08-31"
 *         active:
 *           type: boolean
 *           description: Trạng thái active
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Ngày tạo
 *           example: "2024-06-01T10:00:00Z"
 *   
 *     CreateVoucherRequest:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - discount_type
 *         - discount_value
 *         - start_date
 *         - end_date
 *       properties:
 *         code:
 *           type: string
 *           example: "WELCOME10"
 *           minLength: 3
 *           maxLength: 50
 *         name:
 *           type: string
 *           example: "Voucher chào mừng"
 *           minLength: 1
 *           maxLength: 100
 *         description:
 *           type: string
 *           example: "Giảm 10% cho đơn hàng đầu tiên"
 *         discount_type:
 *           type: string
 *           enum: [percentage, fixed_amount, free_shipping]
 *           example: "percentage"
 *         discount_value:
 *           type: number
 *           minimum: 0
 *           example: 10
 *         min_order_amount:
 *           type: number
 *           minimum: 0
 *           example: 0
 *         max_discount_amount:
 *           type: number
 *           minimum: 0
 *           example: 50000
 *         usage_limit:
 *           type: integer
 *           minimum: 1
 *           example: 1000
 *         user_limit:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         start_date:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         end_date:
 *           type: string
 *           format: date
 *           example: "2025-12-31"
 *         active:
 *           type: boolean
 *           example: true
 *     
 *     VoucherValidationRequest:
 *       type: object
 *       required:
 *         - order_amount
 *       properties:
 *         order_amount:
 *           type: number
 *           minimum: 0
 *           description: Tổng giá trị đơn hàng
 *           example: 500000
 *         shipping_fee:
 *           type: number
 *           minimum: 0
 *           description: Phí vận chuyển
 *           example: 30000
 */

// Admin routes
router.get('/admin',
    authMiddleware,
    checkPermission,
    voucherController.getVouchers
);

router.get('/admin/:id',
    authMiddleware,
    checkPermission,
    voucherController.getVoucherById
);

router.post('/admin',
    authMiddleware,
    checkPermission,
    voucherController.createVoucher
);

router.patch('/admin/:id',
    authMiddleware,
    checkPermission,
    voucherController.updateVoucher
);

router.delete('/admin/:id',
    authMiddleware,
    checkPermission,
    voucherController.deleteVoucher
);

// Public routes
router.get('/available',
    voucherController.getAvailableVouchers
);

router.get('/history',
    authMiddleware,
    voucherController.getUserVoucherHistory
);

router.post('/validate/:code',
    voucherController.validateVoucher
);

/**
 * @swagger
 * /api/v1/vouchers/admin:
 *   get:
 *     summary: Lấy danh sách vouchers (Admin)
 *     tags: [Vouchers - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Lọc theo mã voucher
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Lọc theo tên voucher
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái active
 *       - in: query
 *         name: discount_type
 *         schema:
 *           type: string
 *           enum: [percentage, fixed_amount, free_shipping]
 *         description: Lọc theo loại giảm giá
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc theo ngày bắt đầu
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc theo ngày kết thúc
 *     responses:
 *       200:
 *         description: Lấy danh sách voucher thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         totalRecords:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                     vouchers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Voucher'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *   
 *   post:
 *     summary: Tạo voucher mới (Admin)
 *     tags: [Vouchers - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVoucherRequest'
 *     responses:
 *       201:
 *         description: Tạo voucher thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     voucher:
 *                       $ref: '#/components/schemas/Voucher'
 *       400:
 *         description: Bad Request - Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 * 
 * /api/v1/vouchers/admin/{id}:
 *   get:
 *     summary: Lấy chi tiết voucher (Admin)
 *     tags: [Vouchers - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Voucher ID
 *     responses:
 *       200:
 *         description: Lấy thông tin voucher thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     voucher:
 *                       $ref: '#/components/schemas/Voucher'
 *       404:
 *         description: Voucher không tồn tại
 *   
 *   patch:
 *     summary: Cập nhật voucher (Admin)
 *     tags: [Vouchers - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Voucher ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated voucher name"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               discount_type:
 *                 type: string
 *                 enum: [percentage, fixed_amount, free_shipping]
 *               discount_value:
 *                 type: number
 *               min_order_amount:
 *                 type: number
 *               max_discount_amount:
 *                 type: number
 *               usage_limit:
 *                 type: integer
 *               user_limit:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật voucher thành công
 *       404:
 *         description: Voucher không tồn tại
 *   
 *   delete:
 *     summary: Xóa voucher (Admin)
 *     tags: [Vouchers - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Voucher ID
 *     responses:
 *       200:
 *         description: Xóa voucher thành công
 *       404:
 *         description: Voucher không tồn tại
 * 
 * /api/v1/vouchers/available:
 *   get:
 *     summary: Lấy danh sách vouchers có sẵn
 *     tags: [Vouchers - Public]
 *     parameters:
 *       - in: query
 *         name: order_amount
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Giá trị đơn hàng để lọc vouchers phù hợp
 *     responses:
 *       200:
 *         description: Lấy danh sách voucher có sẵn thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     vouchers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Voucher'
 * 
 * /api/v1/vouchers/validate/{code}:
 *   post:
 *     summary: Validate và áp dụng voucher
 *     tags: [Vouchers - Public]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã voucher
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoucherValidationRequest'
 *     responses:
 *       200:
 *         description: Voucher hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     voucher:
 *                       type: object
 *                       properties:
 *                         voucher_id:
 *                           type: integer
 *                         code:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         discount_type:
 *                           type: string
 *                         discount_value:
 *                           type: number
 *                         discount_amount:
 *                           type: number
 *                     order_summary:
 *                       type: object
 *                       properties:
 *                         original_amount:
 *                           type: number
 *                         discount_amount:
 *                           type: number
 *                         final_amount:
 *                           type: number
 *                         shipping_fee:
 *                           type: number
 *       400:
 *         description: Voucher không hợp lệ hoặc không thể áp dụng
 * 
 * /api/v1/vouchers/history:
 *   get:
 *     summary: Lấy lịch sử sử dụng voucher của user
 *     tags: [Vouchers - Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Lấy lịch sử sử dụng voucher thành công
 *       401:
 *         description: Unauthorized
 */

module.exports = {
    router,
    setup: (app) => {
        app.use('/api/v1/vouchers', router);

        app.use('/api/v1/vouchers', methodNotAllowed);
    }
};