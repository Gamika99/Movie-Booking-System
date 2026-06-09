const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin.controller');
const analyticsController = require('../../controllers/analytics.controller');
const reportController = require('../../controllers/report.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin', 'super-admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.get('/activity', adminController.getRecentActivity);
router.get('/health', adminController.getSystemHealth);
router.post('/cache/clear', adminController.clearCache);

// Analytics
router.get('/analytics/revenue', analyticsController.getRevenueAnalytics);
router.get('/analytics/movies', analyticsController.getMovieAnalytics);
router.get('/analytics/users', analyticsController.getUserAnalytics);
router.get('/analytics/theaters', analyticsController.getTheaterAnalytics);

// Reports
router.get('/reports/bookings', reportController.generateBookingReport);
router.get('/reports/revenue', reportController.generateRevenueReport);

module.exports = router;