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
                count: { $sum: 1 }
            }
        }]);
        return stats;
    }
}

module.exports = new UserRepository();