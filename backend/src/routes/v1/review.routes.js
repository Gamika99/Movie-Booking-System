const express = require('express');
const router = express.Router();
const reviewController = require('../../controllers/review.controller');
const { protect, optionalAuth } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// Public routes
router.get('/movie/:movieId', reviewController.getMovieReviews);

// Protected routes
router.use(protect);

router.post('/movie/:movieId', reviewController.addReview);
router.put('/:reviewId', reviewController.updateReview);
router.delete('/:reviewId', reviewController.deleteReview);
router.post('/:reviewId/helpful', reviewController.markReviewHelpful);
router.get('/my-reviews', reviewController.getUserReviews);

// Admin can delete any review
router.delete('/admin/:reviewId',
    authorize('admin', 'super-admin'),
    reviewController.deleteReview
);

module.exports = router;