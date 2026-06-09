const userRepository = require('../repositories/user.repository');
const movieRepository = require('../repositories/movie.repository');
const theaterRepository = require('../repositories/theater.repository');
const bookingRepository = require('../repositories/booking.repository');
const paymentRepository = require('../repositories/payment.repository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

class AdminService {
    async getDashboardStats() {
        const cacheKey = 'admin:dashboard:stats';
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            totalMovies,
            totalTheaters,
            totalBookings,
            todayBookings,
            weekBookings,
            monthBookings,
            revenueStats,
            userStats
        ] = await Promise.all([
            userRepository.countDocuments({}),
            movieRepository.countDocuments({}),
            theaterRepository.countDocuments({ isActive: true }),
            bookingRepository.countDocuments({ status: 'confirmed' }),
            bookingRepository.countDocuments({
                status: 'confirmed',
                createdAt: { $gte: startOfDay }
            }),
            bookingRepository.countDocuments({
                status: 'confirmed',
                createdAt: { $gte: startOfWeek }
            }),
            bookingRepository.countDocuments({
                status: 'confirmed',
                createdAt: { $gte: startOfMonth }
            }),
            paymentRepository.getRevenueStats(startOfMonth, new Date()),
            userRepository.getUsersStats()
        ]);

        const stats = {
            overview: {
                totalUsers,
                totalMovies,
                totalTheaters,
                totalBookings,
                totalRevenue: revenueStats.reduce((sum, stat) => sum + stat.totalAmount, 0)
            },
            bookings: {
                today: todayBookings,
                thisWeek: weekBookings,
                thisMonth: monthBookings
            },
            users: userStats,
            revenue: revenueStats,
            lastUpdated: new Date()
        };

        await redisClient.set(cacheKey, stats, 300); // Cache for 5 minutes

        return stats;
    }

    async getRecentActivity(limit = 10) {
        const recentBookings = await bookingRepository.findAll({ status: 'confirmed' }, { limit, sort: '-createdAt' });

        const recentUsers = await userRepository.findAll({}, { limit, sort: '-createdAt' });

        return {
            recentBookings: recentBookings.data,
            recentUsers: recentUsers.data
        };
    }

    async getSystemHealth() {
        const mongodbStatus = await this.checkMongoDB();
        const redisStatus = await this.checkRedis();

        return {
            status: mongodbStatus && redisStatus ? 'healthy' : 'degraded',
            services: {
                mongodb: mongodbStatus ? 'connected' : 'disconnected',
                redis: redisStatus ? 'connected' : 'disconnected'
            },
            timestamp: new Date()
        };
    }

    async checkMongoDB() {
        try {
            await userRepository.findOne({});
            return true;
        } catch (error) {
            logger.error('MongoDB health check failed:', error);
            return false;
        }
    }

    async checkRedis() {
        try {
            await redisClient.set('health:check', 'ok', 10);
            return true;
        } catch (error) {
            logger.error('Redis health check failed:', error);
            return false;
        }
    }

    async clearCache() {
        await redisClient.flushAll();
        logger.info('Application cache cleared by admin');
        return true;
    }
}

module.exports = new AdminService();