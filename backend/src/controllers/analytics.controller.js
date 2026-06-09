const analyticsService = require('../services/analytics.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AnalyticsController {
    getRevenueAnalytics = asyncHandler(async(req, res) => {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        const analytics = await analyticsService.getRevenueAnalytics(
            new Date(startDate),
            new Date(endDate),
            groupBy
        );

        res.json(ApiResponse.success(analytics, 'Revenue analytics retrieved'));
    });

    getMovieAnalytics = asyncHandler(async(req, res) => {
        const { startDate, endDate } = req.query;

        const analytics = await analyticsService.getMovieAnalytics(
            new Date(startDate),
            new Date(endDate)
        );

        res.json(ApiResponse.success(analytics, 'Movie analytics retrieved'));
    });

    getUserAnalytics = asyncHandler(async(req, res) => {
        const { startDate, endDate } = req.query;

        const analytics = await analyticsService.getUserAnalytics(
            new Date(startDate),
            new Date(endDate)
        );

        res.json(ApiResponse.success(analytics, 'User analytics retrieved'));
    });

    getTheaterAnalytics = asyncHandler(async(req, res) => {
        const { startDate, endDate } = req.query;

        const analytics = await analyticsService.getTheaterAnalytics(
            new Date(startDate),
            new Date(endDate)
        );

        res.json(ApiResponse.success(analytics, 'Theater analytics retrieved'));
    });
}

module.exports = new AnalyticsController();