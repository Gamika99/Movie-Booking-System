const { body } = require('express-validator');

const movieValidation = {
    create: [
        body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }),
        body('description').notEmpty().withMessage('Description is required'),
        body('duration').isInt({ min: 30, max: 240 }).withMessage('Duration must be between 30-240 minutes'),
        body('language').isArray().withMessage('Language must be an array'),
        body('genre').isArray().withMessage('Genre must be an array'),
        body('releaseDate').isISO8601().withMessage('Valid release date required'),
        body('endDate').isISO8601().withMessage('Valid end date required').custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.releaseDate)) {
                throw new Error('End date must be after release date');
            }
            return true;
        })
    ],

    update: [
        body('title').optional().isLength({ max: 200 }),
        body('duration').optional().isInt({ min: 30, max: 240 }),
        body('releaseDate').optional().isISO8601(),
        body('endDate').optional().isISO8601()
    ]
};

module.exports = movieValidation;