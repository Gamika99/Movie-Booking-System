const { body, param, query } = require('express-validator');

const bookingValidation = {
    initiate: [
        body('showId').isMongoId().withMessage('Valid show ID required'),
        body('seats').isArray({ min: 1 }).withMessage('At least one seat required'),
        body('seats.*.seatId').isMongoId().withMessage('Valid seat ID required'),
        body('paymentMethod').isIn(['card', 'upi', 'netbanking', 'wallet']).withMessage('Invalid payment method'),
        body('seats.*.seatId').custom((value, { req }) => {
            // Check for duplicate seats
            const seatIds = req.body.seats.map(s => s.seatId);
            if (seatIds.length !== new Set(seatIds).size) {
                throw new Error('Duplicate seats found');
            }
            return true;
        })
    ],

    confirm: [
        param('bookingId').isMongoId().withMessage('Valid booking ID required'),
        body('paymentIntentId').notEmpty().withMessage('Payment intent ID required'),
        body('paymentMethod').optional().isIn(['card', 'upi', 'netbanking', 'wallet'])
    ],

    cancel: [
        param('bookingId').isMongoId(),
        body('reason').optional().isString().isLength({ max: 200 })
    ],

    getBookings: [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
        query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'expired'])
    ]
};

module.exports = bookingValidation;