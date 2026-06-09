const Theater = require('../models/theater.model');
const BaseRepository = require('./base.repository');

class TheaterRepository extends BaseRepository {
    constructor() {
        super(Theater);
    }

    async findByCity(city, filters = {}) {
        const query = {
            'address.city': { $regex: city, $options: 'i' },
            isActive: true
        };

        if (filters.hasFacility) {
            query.facilities = { $in: [filters.hasFacility] };
        }

        return await this.model.find(query)
            .sort({ rating: -1 });
    }

    async getTheatersWithMovies(movieId, city, date) {
        const pipeline = [{
                $lookup: {
                    from: 'screens',
                    localField: '_id',
                    foreignField: 'theaterId',
                    as: 'screens'
                }
            },
            {
                $lookup: {
                    from: 'shows',
                    localField: 'screens._id',
                    foreignField: 'screenId',
                    as: 'shows'
                }
            },
            {
                $match: {
                    'shows.movieId': movieId,
                    'shows.date': new Date(date),
                    'shows.isActive': true,
                    isActive: true
                }
            },
            {
                $addFields: {
                    'screens.shows': {
                        $filter: {
                            input: '$shows',
                            as: 'show',
                            cond: { $eq: ['$$show.screenId', '$_id'] }
                        }
                    }
                }
            }
        ];
        return await this.model.aggregate(pipeline);
    }
}

module.exports = new TheaterRepository();