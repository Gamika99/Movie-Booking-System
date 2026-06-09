const User = require('../models/user.model');
const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    async findByEmail(email, includePassword = false) {
        let query = this.model.findOne({ email });
        if (includePassword) query = query.select('+password');
        return await query;
    }

    async findByRefreshToken(refreshToken) {
        return await this.model.findOne({ refreshToken });
    }

    async updatePassword(userId, newPassword) {
        const user = await this.model.findById(userId);
        user.password = newPassword;
        await user.save();
        return user;
    }

    async updateRefreshToken(userId, refreshToken) {
        return await this.update(userId, { refreshToken });
    }

    async blockUser(userId) {
        return await this.update(userId, { isBlocked: true });
    }

    async unblockUser(userId) {
        return await this.update(userId, { isBlocked: false });
    }

    async getUsersStats() {
        const stats = await this.model.aggregate([{
            $group: {
                _id: '$role',
                count: { $sum: 1 },
                blockedCount: { $sum: { $cond: ['$isBlocked', 1, 0] } },
                verifiedCount: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
            }
        }]);
        return stats;
    }

    async getUsersWithFilters(filters, pagination) {
        const { page = 1, limit = 10, role, isBlocked, isEmailVerified, search } = filters;
        const skip = (page - 1) * limit;

        const query = {};
        if (role) query.role = role;
        if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
        if (isEmailVerified !== undefined) query.isEmailVerified = isEmailVerified === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const [users, total] = await Promise.all([
            this.model.find(query)
            .select('-password -refreshToken')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
            this.model.countDocuments(query)
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getUserActivityStats(userId) {
        const Booking = require('../models/booking.model');
        const Payment = require('../models/payment.model');
        const Review = require('../models/review.model');

        const [bookings, payments, reviews] = await Promise.all([
            Booking.countDocuments({ userId, status: 'confirmed' }),
            Payment.countDocuments({ userId, paymentStatus: 'success' }),
            Review.countDocuments({ userId })
        ]);

        const totalSpent = await Payment.aggregate([
            { $match: { userId, paymentStatus: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return {
            totalBookings: bookings,
            totalPayments: payments,
            totalReviews: reviews,
            totalSpent: totalSpent[0]?.total || 0
        };
    }
}

module.exports = new UserRepository();