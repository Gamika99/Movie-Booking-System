const cron = require('node-cron');
const Booking = require('../models/booking.model');
const emailService = require('../services/email.service');
const userRepository = require('../repositories/user.repository');
const logger = require('../utils/logger');

class BookingRemindersJob {
    constructor() {
        this.scheduleJob();
    }

    scheduleJob() {
        // Run every hour
        cron.schedule('0 * * * *', async() => {
            await this.sendReminders();
        });

        logger.info('Booking reminders job scheduled');
    }

    async sendReminders() {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const nextDay = new Date(tomorrow);
            nextDay.setDate(nextDay.getDate() + 1);

            const bookings = await Booking.find({
                status: 'confirmed',
                'showId.startTime': {
                    $gte: tomorrow,
                    $lt: nextDay
                }
            }).populate('showId').populate('userId');

            for (const booking of bookings) {
                await this.sendReminder(booking);
            }

            logger.info(`Sent ${bookings.length} booking reminders`);
        } catch (error) {
            logger.error('Failed to send booking reminders:', error);
        }
    }

    async sendReminder(booking) {
        const user = booking.userId;
        const show = booking.showId;

        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
          .reminder-box { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Movie Reminder! 🎬</h1>
          </div>
          <div class="reminder-box">
            <h2>Don't forget your movie show tomorrow!</h2>
            <p><strong>Movie:</strong> ${show.movieId.title}</p>
            <p><strong>Time:</strong> ${new Date(show.startTime).toLocaleString()}</p>
            <p><strong>Theater:</strong> ${show.theaterId.name}</p>
            <p><strong>Seats:</strong> ${booking.seats.map(s => s.seatNumber).join(', ')}</p>
          </div>
          <p>Enjoy your movie experience! 🍿</p>
        </div>
      </body>
      </html>
    `;

        await emailService.sendEmail({
            to: user.email,
            subject: `Movie Reminder: ${show.movieId.title} Tomorrow`,
            html: emailHtml,
            text: `Don't forget your movie ${show.movieId.title} tomorrow at ${new Date(show.startTime).toLocaleString()}`
        });
    }
}

module.exports = new BookingRemindersJob();