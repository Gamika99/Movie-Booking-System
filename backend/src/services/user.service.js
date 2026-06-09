const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

class UserService {
    async getAllUsers(filters, pagination) {
        const cacheKey = `users:list:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const result = await userRepository.getUsersWithFilters(filters, pagination);

        await redisClient.set(cacheKey, result, 300);

        return result;
    }

    async getUserById(userId) {
        const cacheKey = `user:${userId}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const userActivity = await userRepository.getUserActivityStats(userId);

        const userData = {
            ...user.toObject(),
            activity: userActivity
        };

        await redisClient.set(cacheKey, userData, 600);

        return userData;
    }

    async updateUserProfile(userId, updateData) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Prevent role updates through this endpoint
        delete updateData.role;
        delete updateData.email; // Email cannot be changed here

        const updatedUser = await userRepository.update(userId, updateData);

        await redisClient.del(`user:${userId}`);
        await redisClient.delPattern(`users:list:*`);

        logger.info(`User profile updated: ${userId}`);

        return updatedUser;
    }

    async blockUser(userId, adminId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        if (user.role === 'admin' || user.role === 'super-admin') {
            throw new ApiError(403, 'Cannot block admin users');
        }

        const updatedUser = await userRepository.blockUser(userId);

        await this.clearUserCache(userId);

        logger.info(`User ${userId} blocked by admin ${adminId}`);

        return updatedUser;
    }

    async unblockUser(userId, adminId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const updatedUser = await userRepository.unblockUser(userId);

        await this.clearUserCache(userId);

        logger.info(`User ${userId} unblocked by admin ${adminId}`);

        return updatedUser;
    }

    async deleteUser(userId, adminId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        if (user.role === 'admin' || user.role === 'super-admin') {
            throw new ApiError(403, 'Cannot delete admin users');
        }

        // Check if user has active bookings
        const Booking = require('../models/booking.model');
        const activeBookings = await Booking.exists({
            userId,
            status: 'confirmed',
            'showId.startTime': { $gt: new Date() }
        });

        if (activeBookings) {
            throw new ApiError(400, 'Cannot delete user with active future bookings');
        }

        await userRepository.delete(userId);

        await this.clearUserCache(userId);

        logger.info(`User ${userId} deleted by admin ${adminId}`);

        return true;
    }

    async changeUserRole(userId, newRole, adminId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        if (!['user', 'admin'].includes(newRole)) {
            throw new ApiError(400, 'Invalid role');
        }

        const updatedUser = await userRepository.update(userId, { role: newRole });

        await this.clearUserCache(userId);

        logger.info(`User ${userId} role changed to ${newRole} by admin ${adminId}`);

        return updatedUser;
    }

    async getUserStats() {
        const cacheKey = 'users:stats';
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const stats = await userRepository.getUsersStats();

        await redisClient.set(cacheKey, stats, 600);

        return stats;
    }

    async clearUserCache(userId = null) {
        if (userId) {
            await redisClient.del(`user:${userId}`);
        }
        await redisClient.delPattern('users:list:*');
        await redisClient.del('users:stats');
    }
}

module.exports = new UserService();