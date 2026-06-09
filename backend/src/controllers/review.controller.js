const reviewService = require('../services/review.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class ReviewController {
    addReview = asyncHandler(async(req, res) => {
        const { movieId } = req.params;
        const userId = req.userId;
        const reviewData = req.body;

        const review = await reviewService.addReview(userId, movieId, reviewData);

        res.status(201).json(ApiResponse.success(review, 'Review added successfully', 201));
    });

    updateReview = asyncHandler(async(req, res) => {
        const { reviewId } = req.params;
        const userId = req.userId;
        const updateData = req.body;

        const review = await reviewService.updateReview(reviewId, userId, updateData);

        res.json(ApiResponse.success(review, 'Review updated successfully'));
    });

    deleteReview = asyncHandler(async(req, res) => {
        const { reviewId } = req.params;
        const userId = req.userId;
        const isAdmin = req.userRole === 'admin' || req.userRole === 'super-admin';

        await reviewService.deleteReview(reviewId, userId, isAdmin);

        res.json(ApiResponse.success(null, 'Review deleted successfully'));
    });

    getMovieReviews = asyncHandler(async(req, res) => {
        const { movieId } = req.params;
        const { page = 1, limit = 10, rating, isVerified } = req.query;

        const reviews = await reviewService.getMovieReviews(
            movieId, { rating, isVerified }, { page: parseInt(page), limit: parseInt(limit) }
        );

        res.json(ApiResponse.success(reviews, 'Movie reviews retrieved'));
    });

    markReviewHelpful = asyncHandler(async(req, res) => {
        const { reviewId } = req.params;
        const userId = req.userId;

        const review = await reviewService.markReviewHelpful(reviewId, userId);

        res.json(ApiResponse.success(review, 'Review marked as helpful'));
    });

    getUserReviews = asyncHandler(async(req, res) => {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await reviewService.getUserReviews(
            userId, { page: parseInt(page), limit: parseInt(limit) }
        );

        res.json(ApiResponse.success(reviews, 'Your reviews retrieved'));
    });
}

module.exports = new ReviewController();