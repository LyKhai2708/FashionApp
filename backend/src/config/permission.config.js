const PERMISSION_ROUTES = {
    // ========== PRODUCT MANAGEMENT ==========
    'products.create': {
        paths: ['POST /api/v1/products'],
        description: 'Tạo sản phẩm mới'
    },
    'products.edit': {
        paths: [
            'PATCH /api/v1/products/:id',
            'PUT /api/v1/products/:id/restore'
        ],
        description: 'Sửa và restore sản phẩm'
    },
    'products.delete': {
        paths: [
            'DELETE /api/v1/products/:id',
            'DELETE /api/v1/products/:id/permanent'
        ],
        description: 'Xóa sản phẩm (soft/hard delete)'
    },

    // ========== CATEGORY MANAGEMENT ==========
    'categories.create': {
        paths: ['POST /api/v1/categories'],
        description: 'Tạo danh mục'
    },
    'categories.edit': {
        paths: [
            'PUT /api/v1/categories/:category_id',
            'PATCH /api/v1/categories/:id/toggle'
        ],
        description: 'Sửa danh mục'
    },
    'categories.delete': {
        paths: [
            'DELETE /api/v1/categories',
            'DELETE /api/v1/categories/:category_id'
        ],
        description: 'Xóa danh mục'
    },

    // ========== ORDER MANAGEMENT ==========
    'orders.manage_status': {
        paths: ['PATCH /api/v1/orders/:id/status'],
        description: 'Cập nhật trạng thái đơn hàng (Admin/Manager/Staff)'
    },
    'orders.cancel': {
        paths: ['DELETE /api/v1/orders/:id/cancel'],
        description: 'Hủy đơn hàng (Owner hoặc Admin/Manager)'
    },

    // ========== USER MANAGEMENT ==========
    'users.create': {
        paths: ['POST /api/v1/users'],
        description: 'Tạo user mới'
    },
    'users.view': {
        paths: ['GET /api/v1/users', 'GET /api/v1/users/:id'],
        description: 'Xem danh sách và chi tiết user'
    },
    'users.edit': {
        paths: ['PATCH /api/v1/users/:id'],
        description: 'Sửa thông tin user'
    },
    'users.delete': {
        paths: ['DELETE /api/v1/users/:id'],
        description: 'Vô hiệu hóa user'
    },

    // ========== BRAND MANAGEMENT ==========
    'brands.create': {
        paths: ['POST /api/v1/brands'],
        description: 'Tạo thương hiệu'
    },
    'brands.edit': {
        paths: ['PUT /api/v1/brands/:id'],
        description: 'Sửa thương hiệu'
    },
    'brands.delete': {
        paths: ['DELETE /api/v1/brands/:id'],
        description: 'Xóa thương hiệu'
    },

    // ========== COLOR MANAGEMENT ==========
    'colors.create': {
        paths: ['POST /api/v1/colors'],
        description: 'Tạo màu sắc'
    },
    'colors.edit': {
        paths: ['PUT /api/v1/colors/:id'],
        description: 'Sửa màu sắc'
    },
    'colors.delete': {
        paths: ['DELETE /api/v1/colors/:id'],
        description: 'Xóa màu sắc'
    },

    // ========== SIZE MANAGEMENT ==========
    'sizes.create': {
        paths: ['POST /api/v1/sizes'],
        description: 'Tạo kích cỡ'
    },
    'sizes.edit': {
        paths: ['PUT /api/v1/sizes/:id'],
        description: 'Sửa kích cỡ'
    },
    'sizes.delete': {
        paths: ['DELETE /api/v1/sizes/:id'],
        description: 'Xóa kích cỡ'
    },

    // ========== VARIANT MANAGEMENT ==========
    'variants.create': {
        paths: ['POST /api/v1/products/:productId/variants'],
        description: 'Tạo biến thể sản phẩm'
    },
    'variants.edit': {
        paths: ['PUT /api/v1/products/:productId/variants/:id'],
        description: 'Sửa biến thể'
    },
    'variants.delete': {
        paths: ['DELETE /api/v1/products/:productId/variants/:id'],
        description: 'Xóa biến thể'
    },

    // ========== IMAGE MANAGEMENT ==========
    'images.upload': {
        paths: ['POST /api/v1/products/:productId/images'],
        description: 'Upload ảnh sản phẩm'
    },
    'images.delete': {
        paths: ['DELETE /api/v1/products/:productId/images/:imageId'],
        description: 'Xóa ảnh sản phẩm'
    },

    // ========== VOUCHER MANAGEMENT ==========
    'vouchers.create': {
        paths: ['POST /api/v1/vouchers'],
        description: 'Tạo voucher'
    },
    'vouchers.edit': {
        paths: [
            'PUT /api/v1/vouchers/:id',
            'PATCH /api/v1/vouchers/:id/toggle'
        ],
        description: 'Sửa voucher'
    },
    'vouchers.delete': {
        paths: ['DELETE /api/v1/vouchers/:id'],
        description: 'Xóa voucher'
    },

    // ========== PROMOTION MANAGEMENT ==========
    'promotions.create': {
        paths: ['POST /api/v1/promotions'],
        description: 'Tạo khuyến mãi'
    },
    'promotions.edit': {
        paths: ['PUT /api/v1/promotions/:id'],
        description: 'Sửa khuyến mãi'
    },
    'promotions.delete': {
        paths: ['DELETE /api/v1/promotions/:id'],
        description: 'Xóa khuyến mãi'
    },

    // ========== BANNER MANAGEMENT ==========
    'banners.create': {
        paths: ['POST /api/v1/banners'],
        description: 'Tạo banner'
    },
    'banners.edit': {
        paths: ['PUT /api/v1/banners/:id'],
        description: 'Sửa banner'
    },
    'banners.delete': {
        paths: ['DELETE /api/v1/banners/:id'],
        description: 'Xóa banner'
    },

    // ========== DASHBOARD ==========
    'dashboard.view': {
        paths: [
            'GET /api/v1/admin/dashboard/stats',
            'GET /api/v1/admin/dashboard/revenue-chart'
        ],
        description: 'Xem dashboard admin'
    },

    // ========== INVENTORY MANAGEMENT ==========
    'inventory.view': {
        paths: [
            'GET /api/v1/inventory/overview',
            'GET /api/v1/inventory/low-stock',
            'GET /api/v1/inventory/history',
            'GET /api/v1/inventory/trend'
        ],
        description: 'Xem thông tin kho hàng'
    },
    'inventory.adjust': {
        paths: ['POST /api/v1/inventory/adjust/:variantId'],
        description: 'Điều chỉnh tồn kho'
    },

    // ========== SUPPLIER MANAGEMENT ==========
    'suppliers.view': {
        paths: ['GET /api/v1/suppliers', 'GET /api/v1/suppliers/:id'],
        description: 'Xem danh sách nhà cung cấp'
    },
    'suppliers.create': {
        paths: ['POST /api/v1/suppliers'],
        description: 'Tạo nhà cung cấp mới'
    },
    'suppliers.edit': {
        paths: ['PUT /api/v1/suppliers/:id'],
        description: 'Sửa thông tin nhà cung cấp'
    },
    'suppliers.delete': {
        paths: ['DELETE /api/v1/suppliers/:id'],
        description: 'Xóa nhà cung cấp'
    },

    // ========== PURCHASE ORDER MANAGEMENT ==========
    'purchase_orders.view': {
        paths: ['GET /api/v1/purchase-orders', 'GET /api/v1/purchase-orders/:id'],
        description: 'Xem danh sách phiếu nhập'
    },
    'purchase_orders.create': {
        paths: ['POST /api/v1/purchase-orders'],
        description: 'Tạo phiếu nhập kho'
    },
    'purchase_orders.approve': {
        paths: ['PATCH /api/v1/purchase-orders/:id/status'],
        description: 'Duyệt/Hoàn tất nhập kho'
    },
    'purchase_orders.cancel': {
        paths: ['DELETE /api/v1/purchase-orders/:id'],
        description: 'Hủy phiếu nhập'
    },


    'payments.manage': {
        paths: ['PATCH /api/v1/payments/admin/status/:orderId'],
        description: 'Quản lý trạng thái thanh toán (Admin/Manager)'
    },

    // ========== ROLE MANAGEMENT ==========
    'roles.manage': {
        paths: [
            'GET /api/v1/admin/roles',
            'GET /api/v1/admin/roles/:roleId',
            'GET /api/v1/admin/roles/:roleId/permissions',
            'PUT /api/v1/admin/roles/:roleId/permissions',
            'GET /api/v1/admin/roles/:roleId/users',
            'GET /api/v1/users/:id/role',
            'PUT /api/v1/users/:id/role'
        ],
        description: 'Quản lý roles và permissions (admin only)'
    }
};

module.exports = { PERMISSION_ROUTES };
