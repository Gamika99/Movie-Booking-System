const Booking = require('../models/booking.model');
const BaseRepository = require('./base.repository');
const mongoose = require('mongoose');

class BookingRepository extends BaseRepository {
    constructor() {
        super(Booking);
    }

    async findUserBookings(userId, filters = {}, pagination = {}) {
        const { page = 1, limit = 10, status } = filters;
        const skip = (page - 1) * limit;

        const query = { userId };
        if (status) query.status = status;

        const bookings = await this.model.find(query)
            .populate({
                path: 'showId',
                populate: [
                    { path: 'movieId', select: 'title poster duration language genre' },
                    { path: 'screenId', select: 'name screenType' },
                    { path: 'theaterId', select: 'name address' }
                ]
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await this.model.countDocuments(query);

        return {
            bookings,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async findExpiredBookings() {
        const now = new Date();
        return await this.model.find({
            status: 'pending',
            expiryTime: { $lt: now }
        });
    }

    async findBookingByBookingId(bookingId) {
        return await this.model.findOne({ bookingId })
            .populate({
                path: 'showId',
                populate: [
                    { path: 'movieId', select: 'title poster duration language genre rating' },
                    { path: 'screenId', select: 'name screenType' },
                    { path: 'theaterId', select: 'name address contactNumber' }
                ]
            });
    }

    async updateBookingStatus(bookingId, status, additionalData = {}) {
        const updateData = { status, ...additionalData };
        if (status === 'cancelled') {
            updateData.cancelledAt = new Date();
        }
        return await this.update(bookingId, updateData);
    }

    async getBookingStats(filters = {}) {
        const pipeline = [{
                $match: {
                    createdAt: {
                        $gte: filters.startDate || new Date('2024-01-01'),
                        $lte: filters.endDate || new Date()
                    }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$finalAmount' },
                    totalSeats: { $sum: { $size: '$seats' } }
                }
            }
        ];

        return await this.model.aggregate(pipeline);
    }

    async cancelExpiredBookings(session) {
        const now = new Date();
        return await this.model.updateMany({
            status: 'pending',
            expiryTime: { $lt: now }
        }, {
            status: 'expired',
            cancelledAt: now,
            cancellationReason: 'Payment timeout - booking expired'
        }, { session });
    }
}

module.exports = new BookingRepository();