const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');
const adminController = require('../controllers/admin.controller');
const authController = require('../controllers/auth.controller');
const requireAdmin = [
    authMiddleware,
    checkPermission
];
module.exports.setup = (app) => {
    app.use('/api/v1/admin', router);
    router.post('/login', authController.adminLogin);
    router.post('/logout', authController.adminLogout);
    router.post('/refresh', authController.adminRefresh);
    router.get('/dashboard/stats', requireAdmin, adminController.getDashboardStast);
    router.get('/dashboard/revenue-chart', requireAdmin, adminController.getRevenueChart);
}



