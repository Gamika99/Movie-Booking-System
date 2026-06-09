const bookingService = require('../services/booking.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class BookingController {
    initiateBooking = asyncHandler(async(req, res) => {
        const userId = req.userId;
        const bookingData = req.body;

        const result = await bookingService.initiateBooking(userId, bookingData);

        res.status(201).json(
            ApiResponse.success(result, 'Booking initiated. Complete payment to confirm.', 201)
        );
    });

    confirmBooking = asyncHandler(async(req, res) => {
        const { bookingId } = req.params;
        const paymentDetails = req.body;

        const result = await bookingService.confirmBooking(bookingId, paymentDetails);

        res.json(ApiResponse.success(result, 'Booking confirmed successfully!'));
    });

    cancelBooking = asyncHandler(async(req, res) => {
        const { bookingId } = req.params;
        const userId = req.userId;
        const { reason } = req.body;

        const result = await bookingService.cancelBooking(bookingId, userId, reason);

        res.json(ApiResponse.success(result, 'Booking cancelled successfully'));
    });

    getUserBookings = asyncHandler(async(req, res) => {
        const userId = req.userId;
        const { page = 1, limit = 10, status } = req.query;

        const result = await bookingService.getUserBookings(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            status
        });

        res.json(ApiResponse.success(result, 'Bookings retrieved successfully'));
    });

    getBookingDetails = asyncHandler(async(req, res) => {
        const { bookingId } = req.params;
        const userId = req.userId;

        const booking = await bookingService.getBookingDetails(bookingId, userId);

        res.json(ApiResponse.success(booking, 'Booking details retrieved'));
    });

    getBookingStats = asyncHandler(async(req, res) => {
        const { startDate, endDate } = req.query;

        const stats = await bookingService.getBookingStats(
            new Date(startDate),
            new Date(endDate)
        );

        res.json(ApiResponse.success(stats, 'Booking statistics retrieved'));
    });
}

module.exports = new BookingController();