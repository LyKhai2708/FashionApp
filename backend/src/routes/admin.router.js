const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');
const authController = require('../controllers/auth.controller');
const requireAdmin = [
    authMiddleware,
    authorizeRoles(['admin'])
];
module.exports.setup = (app) => {
    app.use('/api/v1/admin', router);
    router.post('/login', authController.adminLogin);
    router.get('/dashboard/stats', requireAdmin, adminController.getDashboardStast);
    router.get('/dashboard/revenue-chart', requireAdmin, adminController.getRevenueChart);
}



