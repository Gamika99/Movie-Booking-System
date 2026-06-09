const { v4: uuidv4 } = require('uuid');
const bookingRepository = require('../repositories/booking.repository');
const showRepository = require('../repositories/show.repository');
const paymentService = require('./payment.service');
const lockService = require('./lock.service');
const emailService = require('./email.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const redisClient = require('../config/redis');

class BookingService {
    constructor() {
        this.bookingExpiryMinutes = 10; // Booking expires in 10 minutes if not paid
    }

    async initiateBooking(userId, bookingData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { showId, seats, paymentMethod } = bookingData;

            // Get show details
            const show = await showRepository.findById(showId);
            if (!show) {
                throw new ApiError(404, 'Show not found');
            }

            if (!show.isActive) {
                throw new ApiError(400, 'This show is no longer available');
            }

            // Check seat availability
            const seatIds = seats.map(s => s.seatId);
            const bookedSeats = show.bookedSeats.map(bs => bs.seatId.toString());
            const conflictingSeats = seatIds.filter(seatId => bookedSeats.includes(seatId));

            if (conflictingSeats.length > 0) {
                throw new ApiError(400, `Seats ${conflictingSeats.join(',')} are already booked`);
            }

            // Lock seats in Redis
            const lockResult = await lockService.lockSeats(showId, seatIds, userId);

            // Calculate total amount
            const Seat = require('../models/seat.model');
            const seatDetails = await Seat.find({ _id: { $in: seatIds } });

            let totalAmount = 0;
            const seatsWithPrice = seats.map(seat => {
                const seatDetail = seatDetails.find(s => s._id.toString() === seat.seatId);
                const priceMultiplier = seatDetail ? seatDetail.priceMultiplier || 1 : 1;
                const price = show.price * priceMultiplier;
                totalAmount += price;
                return {
                    seatId: seat.seatId,
                    seatNumber: `${seatDetail.row}${seatDetail.number}`,
                    seatType: seatDetail.seatType,
                    price
                };
            });

            // Calculate fees
            const convenienceFee = totalAmount * 0.05; // 5% convenience fee
            const finalAmount = totalAmount + convenienceFee;

            // Generate unique booking ID
            const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // Calculate expiry time
            const expiryTime = new Date(Date.now() + this.bookingExpiryMinutes * 60 * 1000);

            // Create booking
            const booking = await bookingRepository.create({
                bookingId,
                userId,
                showId,
                theaterId: show.theaterId,
                seats: seatsWithPrice,
                totalAmount,
                convenienceFee,
                finalAmount,
                status: 'pending',
                expiryTime,
                bookingTime: new Date()
            });

            // Update show with pending seats
            await showRepository.addBookedSeats(showId, seatsWithPrice, booking._id);
            await showRepository.updateAvailableSeats(showId, seatsWithPrice);

            await session.commitTransaction();

            // Store booking in Redis for quick access
            await redisClient.set(`booking:${booking._id}`, booking, 3600);

            // Release locks after booking is created
            await lockService.releaseLocks(lockResult.locks);

            // Initiate payment
            const paymentIntent = await paymentService.initiatePayment({
                bookingId: booking._id,
                userId,
                amount: finalAmount,
                paymentMethod,
                bookingDetails: {
                    showId,
                    seats: seatsWithPrice,
                    theater: show.theaterId
                }
            });

            return {
                booking,
                paymentIntent,
                expiryTime
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async confirmBooking(bookingId, paymentDetails) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const booking = await bookingRepository.findById(bookingId);
            if (!booking) {
                throw new ApiError(404, 'Booking not found');
            }

            if (booking.status !== 'pending') {
                throw new ApiError(400, `Booking cannot be confirmed. Current status: ${booking.status}`);
            }

            if (new Date() > booking.expiryTime) {
                await this.expireBooking(bookingId, session);
                throw new ApiError(400, 'Booking has expired. Please book again');
            }

            // Process payment
            const paymentResult = await paymentService.processPayment({
                bookingId: booking._id,
                ...paymentDetails
            });

            if (paymentResult.status !== 'success') {
                throw new ApiError(400, 'Payment failed. Please try again');
            }

            // Update booking status
            const confirmedBooking = await bookingRepository.updateBookingStatus(
                booking._id,
                'confirmed'
            );

            // Update show final booking status
            await session.commitTransaction();

            // Send confirmation email
            await this.sendBookingConfirmation(confirmedBooking);

            // Clear cache
            await redisClient.del(`booking:${booking._id}`);
            await redisClient.delPattern(`user-bookings:${booking.userId}:*`);

            return {
                booking: confirmedBooking,
                payment: paymentResult
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async cancelBooking(bookingId, userId, reason = 'User requested cancellation') {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const booking = await bookingRepository.findById(bookingId);

            if (!booking) {
                throw new ApiError(404, 'Booking not found');
            }

            if (booking.userId.toString() !== userId) {
                throw new ApiError(403, 'You can only cancel your own bookings');
            }

            if (booking.status !== 'confirmed') {
                throw new ApiError(400, `Cannot cancel booking with status: ${booking.status}`);
            }

            // Check if show has already started
            const show = await showRepository.findById(booking.showId);
            const now = new Date();
            if (new Date(show.startTime) < now) {
                throw new ApiError(400, 'Cannot cancel booking for show that has already started');
            }

            // Calculate cancellation charge
            const hoursBeforeShow = (new Date(show.startTime) - now) / (1000 * 60 * 60);
            let refundAmount = booking.finalAmount;
            let cancellationCharge = 0;

            if (hoursBeforeShow < 2) {
                cancellationCharge = booking.finalAmount; // No refund
                refundAmount = 0;
            } else if (hoursBeforeShow < 6) {
                cancellationCharge = booking.finalAmount * 0.5; // 50% refund
                refundAmount = booking.finalAmount * 0.5;
            } else {
                cancellationCharge = booking.finalAmount * 0.2; // 80% refund
                refundAmount = booking.finalAmount * 0.8;
            }

            // Process refund
            if (refundAmount > 0) {
                await paymentService.processRefund(bookingId, refundAmount, reason);
            }

            // Update booking status
            const cancelledBooking = await bookingRepository.updateBookingStatus(
                booking._id,
                'cancelled', {
                    cancellationReason: reason,
                    cancelledAt: new Date(),
                    refundAmount,
                    cancellationCharge
                }
            );

            // Release seats back to show
            await showRepository.updateAvailableSeats(
                booking.showId,
                booking.seats,
                true // increment = true (add back seats)
            );

            await session.commitTransaction();

            // Send cancellation email
            await this.sendCancellationEmail(cancelledBooking, refundAmount);

            return {
                booking: cancelledBooking,
                refundAmount,
                cancellationCharge
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async expireBooking(bookingId, session = null) {
        const booking = await bookingRepository.findById(bookingId);
        if (!booking) return;

        const updateSession = session || await mongoose.startSession();
        if (!session) await updateSession.startTransaction();

        try {
            if (booking.status === 'pending') {
                // Update booking status
                await bookingRepository.updateBookingStatus(
                    booking._id,
                    'expired', {
                        cancellationReason: 'Payment timeout - booking expired',
                        cancelledAt: new Date()
                    },
                    updateSession
                );

                // Release seats back to show
                await showRepository.updateAvailableSeats(
                    booking.showId,
                    booking.seats,
                    true, // increment = true
                    updateSession
                );
            }

            if (!session) {
                await updateSession.commitTransaction();
                updateSession.endSession();
            }
        } catch (error) {
            if (!session) {
                await updateSession.abortTransaction();
                updateSession.endSession();
            }
            logger.error('Failed to expire booking:', error);
        }
    }

    async getUserBookings(userId, filters) {
        const cacheKey = `user-bookings:${userId}:${JSON.stringify(filters)}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const result = await bookingRepository.findUserBookings(userId, filters);

        await redisClient.set(cacheKey, result, 300); // Cache for 5 minutes

        return result;
    }

    async getBookingDetails(bookingId, userId) {
        const cacheKey = `booking-details:${bookingId}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const booking = await bookingRepository.findBookingByBookingId(bookingId);

        if (!booking) {
            throw new ApiError(404, 'Booking not found');
        }

        // Check authorization
        if (booking.userId.toString() !== userId && userId !== 'admin') {
            throw new ApiError(403, 'You can only view your own bookings');
        }

        // Get payment details
        const payments = await paymentRepository.findPaymentsByBooking(booking._id);

        const result = {
            ...booking.toObject(),
            payments
        };

        await redisClient.set(cacheKey, result, 600); // Cache for 10 minutes

        return result;
    }

    async sendBookingConfirmation(booking) {
            try {
                const populatedBooking = await bookingRepository.findBookingByBookingId(booking.bookingId);
                const user = await userRepository.findById(booking.userId);

                const seatsList = populatedBooking.seats.map(s => s.seatNumber).join(', ');

                const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .booking-details { background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .seat-info { display: inline-block; background: #6366f1; color: white; padding: 5px 10px; margin: 5px; border-radius: 5px; }
            .total { font-size: 24px; font-weight: bold; color: #10b981; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed! 🎬</h1>
              <p>Booking ID: ${booking.bookingId}</p>
            </div>
            <div class="content">
              <h2>Hello ${user.name},</h2>
              <p>Your booking has been confirmed successfully.</p>
              
              <div class="booking-details">
                <h3>Movie Details:</h3>
                <p><strong>Movie:</strong> ${populatedBooking.showId.movieId.title}</p>
                <p><strong>Theater:</strong> ${populatedBooking.showId.theaterId.name}</p>
                <p><strong>Screen:</strong> ${populatedBooking.showId.screenId.name}</p>
                <p><strong>Date & Time:</strong> ${new Date(populatedBooking.showId.startTime).toLocaleString()}</p>
                
                <h3>Seats:</h3>
                <div>${populatedBooking.seats.map(s => `<span class="seat-info">${s.seatNumber}</span>`).join('')}</div>
                
                <h3>Amount Paid:</h3>
                <p class="total">₹${booking.finalAmount}</p>
              </div>
              
              <div class="qr-code">
                <p><strong>Important:</strong> Please show this email or the QR code at the theater counter.</p>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for choosing Movie Booking System!</p>
              <p>For any queries, contact us at support@moviebooking.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail({
        to: user.email,
        subject: `Booking Confirmed - ${booking.bookingId}`,
        html: emailHtml,
        text: `Your booking ${booking.bookingId} has been confirmed for ${populatedBooking.showId.movieId.title}`
      });
    } catch (error) {
      logger.error('Failed to send booking confirmation email:', error);
    }
  }

  async sendCancellationEmail(booking, refundAmount) {
    try {
      const user = await userRepository.findById(booking.userId);
      const populatedBooking = await bookingRepository.findBookingByBookingId(booking.bookingId);
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .refund-info { background: #fef3c7; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancelled</h1>
              <p>Booking ID: ${booking.bookingId}</p>
            </div>
            <div class="content">
              <h2>Hello ${user.name},</h2>
              <p>Your booking has been cancelled as requested.</p>
              
              <div class="refund-info">
                <h3>Refund Details:</h3>
                <p>Refund Amount: ₹${refundAmount}</p>
                <p>Cancellation Charge: ₹${booking.cancellationCharge}</p>
                <p>Refund will be credited within 5-7 business days.</p>
              </div>
              
              <p>We hope to see you again soon!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail({
        to: user.email,
        subject: `Booking Cancelled - ${booking.bookingId}`,
        html: emailHtml,
        text: `Your booking ${booking.bookingId} has been cancelled. Refund amount: ₹${refundAmount}`
      });
    } catch (error) {
      logger.error('Failed to send cancellation email:', error);
    }
  }

  async getBookingStats(startDate, endDate) {
    return await bookingRepository.getBookingStats({ startDate, endDate });
  }
}

module.exports = new BookingService();