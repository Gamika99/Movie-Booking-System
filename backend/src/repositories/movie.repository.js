const Movie = require('../models/movie.model');
const BaseRepository = require('./base.repository');

class MovieRepository extends BaseRepository {
    constructor() {
        super(Movie);
    }

    async findNowShowing(limit = 10) {
        const now = new Date();
        return await this.model.find({
                releaseDate: { $lte: now },
                endDate: { $gte: now },
                status: 'now-showing',
                isNowShowing: true
            })
            .sort({ releaseDate: -1 })
            .limit(limit);
    }

    async findUpcoming(limit = 10) {
        const now = new Date();
        return await this.model.find({
                releaseDate: { $gt: now },
                status: 'coming-soon'
            })
            .sort({ releaseDate: 1 })
            .limit(limit);
    }

    async searchMovies(keyword, filters = {}) {
        const query = {
            $or: [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        };

        if (filters.genre) {
            query.genre = { $in: [filters.genre] };
        }

        if (filters.language) {
            query.language = { $in: [filters.language] };
        }

        if (filters.status) {
            query.status = filters.status;
        }

        return await this.model.find(query);
    }

    async getMoviesByCity(city, date) {
        // Complex aggregation to find movies playing in specific city on specific date
        const pipeline = [{
                $lookup: {
                    from: 'shows',
                    localField: '_id',
                    foreignField: 'movieId',
                    as: 'shows'
                }
            },
            {
                $lookup: {
                    from: 'screens',
                    localField: 'shows.screenId',
                    foreignField: '_id',
                    as: 'screens'
                }
            },
            {
                $lookup: {
                    from: 'theaters',
                    localField: 'screens.theaterId',
                    foreignField: '_id',
                    as: 'theaters'
                }
            },
            {
                $match: {
                    'theaters.address.city': { $regex: city, $options: 'i' },
                    'shows.date': new Date(date),
                    'shows.isActive': true
                }
            },
            {
                $group: {
                    _id: '$_id',
                    movie: { $first: '$$ROOT' },
                    shows: { $push: '$shows' }
                }
            }
        ];
        return await this.model.aggregate(pipeline);
    }

    async updateRating(movieId) {
        const result = await this.model.aggregate([
            { $match: { _id: movieId } },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'movieId',
                    as: 'reviews'
                }
            },
            {
                $project: {
                    averageRating: { $avg: '$reviews.rating' },
                    totalReviews: { $size: '$reviews' }
                }
            }
        ]);

        if (result.length > 0) {
            await this.model.findByIdAndUpdate(movieId, {
                rating: result[0].averageRating,
                totalRatings: result[0].totalReviews
            });
        }
    }
}

module.exports = new MovieRepository();