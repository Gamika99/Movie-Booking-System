const { body } = require('express-validator');

const theaterValidation = {
    create: [
        body('name').notEmpty().withMessage('Theater name required'),
        body('address.city').notEmpty().withMessage('City required'),
        body('address.street').notEmpty().withMessage('Street address required'),
        body('address.pincode').matches(/^[0-9]{6}$/).withMessage('Valid pincode required'),
        body('contactNumber').matches(/^[0-9]{10}$/).withMessage('Valid contact number required')
    ]
};

module.exports = theaterValidation;