const adminService = require('../services/admin.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AdminController {
    getDashboardStats = asyncHandler(async(req, res) => {
        const stats = await adminService.getDashboardStats();
        res.json(ApiResponse.success(stats, 'Dashboard statistics retrieved'));
    });

    getRecentActivity = asyncHandler(async(req, res) => {
        const { limit = 10 } = req.query;
        const activity = await adminService.getRecentActivity(parseInt(limit));
        res.json(ApiResponse.success(activity, 'Recent activity retrieved'));
    });

    getSystemHealth = asyncHandler(async(req, res) => {
        const health = await adminService.getSystemHealth();
        res.json(ApiResponse.success(health, 'System health status'));
    });

    clearCache = asyncHandler(async(req, res) => {
        await adminService.clearCache();
        res.json(ApiResponse.success(null, 'Cache cleared successfully'));
    });
}

module.exports = new AdminController();