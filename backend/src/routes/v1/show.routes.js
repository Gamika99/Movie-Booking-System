const express = require('express');
const router = express.Router();
const showController = require('../../controllers/show.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { validate } = require('../../validations/auth.validation');
const showValidation = require('../../validations/show.validation');

// Public routes
router.get('/movie/:movieId', showController.getShowsByMovieCity);
router.get('/theater/:theaterId/schedule', showController.getTheaterSchedule);
router.get('/:id/availability', showController.getShowAvailability);

// Admin only routes
router.use(protect);
router.use(authorize('admin', 'super-admin'));

router.post('/',
    validate(showValidation.create),
    showController.createShow
);

router.put('/:id',
    validate(showValidation.update),
    showController.updateShow
);

router.delete('/:id', showController.deleteShow);

module.exports = router;