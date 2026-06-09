const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/booking.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { validate } = require('../../validations/auth.validation');
const bookingValidation = require('../../validations/booking.validation');

// All booking routes require authentication
router.use(protect);

// User routes
router.post('/initiate',
    validate(bookingValidation.initiate),
    bookingController.initiateBooking
);

router.post('/:bookingId/confirm',
    validate(bookingValidation.confirm),
    bookingController.confirmBooking
);

router.post('/:bookingId/cancel',
    validate(bookingValidation.cancel),
    bookingController.cancelBooking
);

router.get('/my-bookings',
    validate(bookingValidation.getBookings),
    bookingController.getUserBookings
);

router.get('/:bookingId',
    bookingController.getBookingDetails
);

// Admin only routes
router.get('/stats/all',
    authorize('admin', 'super-admin'),
    bookingController.getBookingStats
);

module.exports = router;