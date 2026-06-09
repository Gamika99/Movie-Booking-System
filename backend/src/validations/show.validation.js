const { body } = require('express-validator');

const showValidation = {
    create: [
        body('movieId').isMongoId().withMessage('Valid movie ID required'),
        body('screenId').isMongoId().withMessage('Valid screen ID required'),
        body('startTime').isISO8601().withMessage('Valid start time required'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
        body('date').isISO8601().withMessage('Valid date required')
    ],

    update: [
        body('startTime').optional().isISO8601(),
        body('price').optional().isFloat({ min: 0 }),
        body('isActive').optional().isBoolean()
    ]
};

module.exports = showValidation;