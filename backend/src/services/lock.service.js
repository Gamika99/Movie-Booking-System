const redisClient = require('../config/redis');
const logger = require('../utils/logger');

class LockService {
    constructor() {
        this.lockTimeout = 600; // 10 minutes lock timeout
    }

    async lockSeats(showId, seatIds, userId, bookingId = null) {
        const lockKey = `lock:show:${showId}:seats`;
        const locks = [];

        try {
            for (const seatId of seatIds) {
                const seatLockKey = `${lockKey}:${seatId}`;
                const lockValue = `${userId}:${bookingId || Date.now()}`;

                // Try to acquire lock with expiration
                const acquired = await redisClient.set(
                    seatLockKey,
                    lockValue,
                    this.lockTimeout,
                    'NX' // Only set if not exists
                );

                if (!acquired) {
                    // Seat is already locked by someone else
                    const existingLock = await redisClient.get(seatLockKey);
                    throw new Error(`Seat ${seatId} is already locked by another user`);
                }

                locks.push(seatLockKey);
            }

            logger.info(`Seats locked for user ${userId}: ${seatIds.join(',')}`);
            return { success: true, locks };
        } catch (error) {
            // Release any acquired locks on failure
            await this.releaseLocks(locks);
            throw error;
        }
    }

    async releaseLocks(lockKeys) {
        for (const lockKey of lockKeys) {
            await redisClient.del(lockKey);
        }
        logger.info(`Released locks: ${lockKeys.join(',')}`);
    }

    async extendLock(lockKey, userId, additionalSeconds = 300) {
        const currentLock = await redisClient.get(lockKey);
        if (currentLock && currentLock.startsWith(userId)) {
            await redisClient.expire(lockKey, additionalSeconds);
            return true;
        }
        return false;
    }

    async isSeatLocked(showId, seatId) {
        const lockKey = `lock:show:${showId}:seats:${seatId}`;
        const lock = await redisClient.get(lockKey);
        return !!lock;
    }

    async getLockInfo(showId, seatId) {
        const lockKey = `lock:show:${showId}:seats:${seatId}`;
        const lock = await redisClient.get(lockKey);
        if (lock) {
            const [userId, bookingId] = lock.split(':');
            const ttl = await redisClient.ttl(lockKey);
            return { userId, bookingId, ttl };
        }
        return null;
    }
}

module.exports = new LockService();