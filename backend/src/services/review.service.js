const reviewRepository = require('../repositories/review.repository');
const movieRepository = require('../repositories/movie.repository');
const bookingRepository = require('../repositories/booking.repository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

class ReviewService {
    async addReview(userId, movieId, reviewData) {
        // Check if user has watched the movie (has confirmed booking)
        const hasWatched = await bookingRepository.exists({
            userId,
            status: 'confirmed',
            'showId.movieId': movieId
        });

        if (!hasWatched) {
            throw new ApiError(403, 'You can only review movies you have watched');
        }

        // Check if user already reviewed
        const existingReview = await reviewRepository.getUserReviewForMovie(userId, movieId);
        if (existingReview) {
            throw new ApiError(400, 'You have already reviewed this movie');
        }

        const review = await reviewRepository.create({
            userId,
            movieId,
            ...reviewData,
            isVerified: true // Since user has booking, mark as verified
        });

        // Update movie rating
        await movieRepository.updateRating(movieId);

        // Clear cache
        await redisClient.del(`movie:${movieId}`);
        await redisClient.delPattern(`reviews:movie:${movieId}:*`);

        logger.info(`User ${userId} added review for movie ${movieId}`);

        return review;
    }

    async updateReview(reviewId, userId, updateData) {
        const review = await reviewRepository.findById(reviewId);

        if (!review) {
            throw new ApiError(404, 'Review not found');
        }

        if (review.userId.toString() !== userId) {
            throw new ApiError(403, 'You can only update your own reviews');
        }

        const updatedReview = await reviewRepository.update(reviewId, updateData);

        // Update movie rating
        await movieRepository.updateRating(review.movieId);

        // Clear cache
        await redisClient.del(`movie:${review.movieId}`);
        await redisClient.delPattern(`reviews:movie:${review.movieId}:*`);

        return updatedReview;
    }

    async deleteReview(reviewId, userId, isAdmin = false) {
        const review = await reviewRepository.findById(reviewId);

        if (!review) {
            throw new ApiError(404, 'Review not found');
        }

        if (!isAdmin && review.userId.toString() !== userId) {
            throw new ApiError(403, 'You can only delete your own reviews');
        }

        await reviewRepository.delete(reviewId);

        // Update movie rating
        await movieRepository.updateRating(review.movieId);

        // Clear cache
        await redisClient.del(`movie:${review.movieId}`);
        await redisClient.delPattern(`reviews:movie:${review.movieId}:*`);

        logger.info(`Review ${reviewId} deleted by ${isAdmin ? 'admin' : 'user'} ${userId}`);

        return true;
    }

    async getMovieReviews(movieId, filters, pagination) {
        const cacheKey = `reviews:movie:${movieId}:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        // Check if movie exists
        const movie = await movieRepository.findById(movieId);
        if (!movie) {
            throw new ApiError(404, 'Movie not found');
        }

        const reviews = await reviewRepository.findReviewsByMovie(movieId, filters, pagination);
        const ratingStats = await reviewRepository.getMovieRatingStats(movieId);

        const result = {
            movie: {
                id: movie._id,
                title: movie.title,
                poster: movie.poster,
                rating: movie.rating,
                totalRatings: movie.totalRatings
            },
            ratingStats,
            reviews
        };

        await redisClient.set(cacheKey, result, 600);

        return result;
    }

    async markReviewHelpful(reviewId, userId) {
        const review = await reviewRepository.updateReviewHelpful(reviewId, userId, true);

        if (!review) {
            throw new ApiError(404, 'Review not found');
        }

        return review;
    }

    async getUserReviews(userId, pagination) {
        const reviews = await reviewRepository.findAll({ userId }, {...pagination, sort: '-createdAt' });

        return reviews;
    }
}

module.exports = new ReviewService();