const cron = require('node-cron');
const bookingService = require('../services/booking.service');
const bookingRepository = require('../repositories/booking.repository');
const logger = require('../utils/logger');

class ExpiredBookingsJob {
    constructor() {
        this.scheduleJob();
    }

    scheduleJob() {
        // Run every 5 minutes
        cron.schedule('*/5 * * * *', async() => {
            await this.releaseExpiredBookings();
        });

        logger.info('Expired bookings cleanup job scheduled');
    }

    async releaseExpiredBookings() {
        try {
            const expiredBookings = await bookingRepository.findExpiredBookings();

            if (expiredBookings.length === 0) return;

            logger.info(`Found ${expiredBookings.length} expired bookings to release`);

            for (const booking of expiredBookings) {
                try {
                    await bookingService.expireBooking(booking._id);
                    logger.info(`Released expired booking: ${booking.bookingId}`);
                } catch (error) {
                    logger.error(`Failed to release booking ${booking.bookingId}:`, error);
                }
            }
        } catch (error) {
            logger.error('Failed to process expired bookings:', error);
        }
    }
}

module.exports = new ExpiredBookingsJob();