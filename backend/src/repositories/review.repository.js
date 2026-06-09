const Review = require('../models/review.model');
const BaseRepository = require('./base.repository');

class ReviewRepository extends BaseRepository {
    constructor() {
        super(Review);
    }

    async findReviewsByMovie(movieId, filters = {}, pagination = {}) {
        const { page = 1, limit = 10, rating, isVerified } = filters;
        const skip = (page - 1) * limit;

        const query = { movieId };
        if (rating) query.rating = rating;
        if (isVerified !== undefined) query.isVerified = isVerified === 'true';

        const reviews = await this.model.find(query)
            .populate('userId', 'name profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await this.model.countDocuments(query);

        return {
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getUserReviewForMovie(userId, movieId) {
        return await this.model.findOne({ userId, movieId });
    }

    async getMovieRatingStats(movieId) {
        const stats = await this.model.aggregate([
            { $match: { movieId } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }
            },
            {
                $project: {
                    averageRating: { $round: ['$averageRating', 1] },
                    totalReviews: 1,
                    distribution: {
                        1: { $size: { $filter: { input: '$ratingDistribution', as: 'r', cond: { $eq: ['$$r', 1] } } } },
                        2: { $size: { $filter: { input: '$ratingDistribution', as: 'r', cond: { $eq: ['$$r', 2] } } } },
                        3: { $size: { $filter: { input: '$ratingDistribution', as: 'r', cond: { $eq: ['$$r', 3] } } } },
                        4: { $size: { $filter: { input: '$ratingDistribution', as: 'r', cond: { $eq: ['$$r', 4] } } } },
                        5: { $size: { $filter: { input: '$ratingDistribution', as: 'r', cond: { $eq: ['$$r', 5] } } } }
                    }
                }
            }
        ]);

        return stats[0] || { averageRating: 0, totalReviews: 0, distribution: {} };
    }

    async updateReviewHelpful(reviewId, userId, isHelpful) {
        const review = await this.findById(reviewId);
        if (!review) return null;

        if (isHelpful) {
            if (!review.likes.includes(userId)) {
                review.likes.push(userId);
                review.helpful += 1;
            }
        } else {
            const index = review.likes.indexOf(userId);
            if (index > -1) {
                review.likes.splice(index, 1);
                review.helpful -= 1;
            }
        }

        await review.save();
        return review;
    }
}

module.exports = new ReviewRepository();