const express = require('express');
const router = express.Router();
const movieController = require('../../controllers/movie.controller');
const { protect, optionalAuth } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { uploadSingle } = require('../../middleware/upload.middleware');
const { validate } = require('../../validations/auth.validation');
const movieValidation = require('../../validations/movie.validation');

// Public routes
router.get('/', movieController.getAllMovies);
router.get('/now-showing', movieController.getNowShowing);
router.get('/upcoming', movieController.getUpcoming);
router.get('/search', movieController.searchMovies);
router.get('/by-city', movieController.getMoviesByCity);
router.get('/:id', optionalAuth, movieController.getMovieById);

// Admin only routes
router.use(protect);
router.use(authorize('admin', 'super-admin'));

router.post('/',
    uploadSingle('poster'),
    validate(movieValidation.create),
    movieController.createMovie
);

router.put('/:id',
    uploadSingle('poster'),
    validate(movieValidation.update),
    movieController.updateMovie
);

router.delete('/:id', movieController.deleteMovie);

module.exports = router;