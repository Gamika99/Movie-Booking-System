const bookingRepository = require('../repositories/booking.repository');
const paymentRepository = require('../repositories/payment.repository');
const userRepository = require('../repositories/user.repository');
const movieRepository = require('../repositories/movie.repository');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

class AnalyticsService {
    async getRevenueAnalytics(startDate, endDate, groupBy = 'day') {
        const cacheKey = `analytics:revenue:${startDate}:${endDate}:${groupBy}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const revenueData = await paymentRepository.getRevenueStats(startDate, endDate);

        // Format data based on groupBy
        const formattedData = this.formatRevenueData(revenueData, startDate, endDate, groupBy);

        const analytics = {
            totalRevenue: revenueData.reduce((sum, item) => sum + item.totalAmount, 0),
            totalTransactions: revenueData.length,
            averageTransactionValue: revenueData.length > 0 ?
                revenueData.reduce((sum, item) => sum + item.totalAmount, 0) / revenueData.length : 0,
            data: formattedData,
            period: { startDate, endDate, groupBy }
        };

        await redisClient.set(cacheKey, analytics, 1800);

        return analytics;
    }

    async getMovieAnalytics(startDate, endDate) {
        const cacheKey = `analytics:movies:${startDate}:${endDate}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const pipeline = [{
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'confirmed'
                }
            },
            {
                $lookup: {
                    from: 'shows',
                    localField: 'showId',
                    foreignField: '_id',
                    as: 'show'
                }
            },
            { $unwind: '$show' },
            {
                $lookup: {
                    from: 'movies',
                    localField: 'show.movieId',
                    foreignField: '_id',
                    as: 'movie'
                }
            },
            { $unwind: '$movie' },
            {
                $group: {
                    _id: '$movie._id',
                    movieTitle: { $first: '$movie.title' },
                    moviePoster: { $first: '$movie.poster' },
                    totalBookings: { $sum: 1 },
                    totalSeats: { $sum: { $size: '$seats' } },
                    totalRevenue: { $sum: '$finalAmount' },
                    averageRating: { $first: '$movie.rating' }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ];

        const movieStats = await bookingRepository.aggregate(pipeline);

        const topMovies = movieStats.slice(0, 5);
        const lowPerforming = movieStats.slice(-5);

        const analytics = {
            totalMoviesScreened: movieStats.length,
            topMovies,
            lowPerformingMovies: lowPerforming,
            totalRevenueFromMovies: movieStats.reduce((sum, m) => sum + m.totalRevenue, 0),
            totalSeatsBooked: movieStats.reduce((sum, m) => sum + m.totalSeats, 0)
        };

        await redisClient.set(cacheKey, analytics, 3600);

        return analytics;
    }

    async getUserAnalytics(startDate, endDate) {
        const cacheKey = `analytics:users:${startDate}:${endDate}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const newUsers = await userRepository.aggregate([{
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        const userEngagement = await bookingRepository.aggregate([{
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'confirmed'
                }
            },
            {
                $group: {
                    _id: '$userId',
                    totalSpent: { $sum: '$finalAmount' },
                    totalBookings: { $sum: 1 },
                    totalSeats: { $sum: { $size: '$seats' } }
                }
            },
            {
                $group: {
                    _id: null,
                    averageSpentPerUser: { $avg: '$totalSpent' },
                    averageBookingsPerUser: { $avg: '$totalBookings' },
                    topSpenders: { $push: { userId: '$_id', totalSpent: '$totalSpent' } }
                }
            }
        ]);

        const topSpenders = userEngagement[0]?.topSpenders
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10) || [];

        // Get user details for top spenders
        const topSpenderDetails = await Promise.all(
            topSpenders.map(async(spender) => {
                const user = await userRepository.findById(spender.userId);
                return {
                    userId: spender.userId,
                    name: user?.name,
                    email: user?.email,
                    totalSpent: spender.totalSpent
                };
            })
        );

        const analytics = {
            newUsers: {
                total: newUsers.reduce((sum, day) => sum + day.count, 0),
                dailyBreakdown: newUsers
            },
            engagement: {
                averageSpentPerUser: userEngagement[0]?.averageSpentPerUser || 0,
                averageBookingsPerUser: userEngagement[0]?.averageBookingsPerUser || 0,
                topSpenders: topSpenderDetails
            },
            retention: await this.getUserRetentionRate(startDate, endDate)
        };

        await redisClient.set(cacheKey, analytics, 3600);

        return analytics;
    }

    async getUserRetentionRate(startDate, endDate) {
        // Get users who booked in the period
        const activeUsers = await bookingRepository.aggregate([{
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'confirmed'
                }
            },
            { $group: { _id: '$userId' } }
        ]);

        const activeUserIds = activeUsers.map(u => u._id);

        // Check which of these users also booked in previous period
        const previousPeriodEnd = new Date(startDate);
        const previousPeriodStart = new Date(previousPeriodEnd);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - (endDate - startDate) / (1000 * 60 * 60 * 24));

        const returningUsers = await bookingRepository.aggregate([{
                $match: {
                    userId: { $in: activeUserIds },
                    createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
                    status: 'confirmed'
                }
            },
            { $group: { _id: '$userId' } }
        ]);

        const retentionRate = activeUserIds.length > 0 ?
            (returningUsers.length / activeUserIds.length) * 100 :
            0;

        return {
            retentionRate: Math.round(retentionRate * 10) / 10,
            activeUsers: activeUserIds.length,
            returningUsers: returningUsers.length
        };
    }

    async getTheaterAnalytics(startDate, endDate) {
        const cacheKey = `analytics:theaters:${startDate}:${endDate}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const theaterStats = await bookingRepository.aggregate([{
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'confirmed'
                }
            },
            {
                $lookup: {
                    from: 'theaters',
                    localField: 'theaterId',
                    foreignField: '_id',
                    as: 'theater'
                }
            },
            { $unwind: '$theater' },
            {
                $group: {
                    _id: '$theaterId',
                    theaterName: { $first: '$theater.name' },
                    city: { $first: '$theater.address.city' },
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: '$finalAmount' },
                    totalSeats: { $sum: { $size: '$seats' } },
                    averageOccupancy: { $avg: { $size: '$seats' } }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        const analytics = {
            topTheaters: theaterStats.slice(0, 5),
            cityBreakdown: this.groupByCity(theaterStats),
            totalTheaters: theaterStats.length,
            totalRevenue: theaterStats.reduce((sum, t) => sum + t.totalRevenue, 0)
        };

        await redisClient.set(cacheKey, analytics, 3600);

        return analytics;
    }

    groupByCity(theaterStats) {
        const cityMap = {};
        theaterStats.forEach(theater => {
            if (!cityMap[theater.city]) {
                cityMap[theater.city] = {
                    city: theater.city,
                    totalRevenue: 0,
                    totalBookings: 0,
                    theaters: []
                };
            }
            cityMap[theater.city].totalRevenue += theater.totalRevenue;
            cityMap[theater.city].totalBookings += theater.totalBookings;
            cityMap[theater.city].theaters.push(theater);
        });
        return Object.values(cityMap);
    }

    formatRevenueData(data, startDate, endDate, groupBy) {
        const formatted = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            let key;
            if (groupBy === 'day') {
                key = currentDate.toISOString().split('T')[0];
            } else if (groupBy === 'week') {
                const weekNumber = this.getWeekNumber(currentDate);
                key = `Week ${weekNumber}`;
            } else {
                key = currentDate.toLocaleString('default', { month: 'long' });
            }

            const dayData = data.find(item => {
                if (groupBy === 'day') {
                    return item._id.day === currentDate.getDate() &&
                        item._id.month === currentDate.getMonth() + 1;
                }
                return true; // Simplified for demo
            });

            formatted.push({
                period: key,
                revenue: dayData?.totalAmount || 0,
                transactions: dayData?.count || 0
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return formatted;
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
}

module.exports = new AnalyticsService();