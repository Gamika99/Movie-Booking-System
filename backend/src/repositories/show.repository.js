const Show = require('../models/show.model');
const BaseRepository = require('./base.repository');

class ShowRepository extends BaseRepository {
    constructor() {
        super(Show);
    }

    async findShowsByMovieAndCity(movieId, city, date) {
        const pipeline = [{
                $match: {
                    movieId: movieId,
                    date: new Date(date),
                    isActive: true
                }
            },
            {
                $lookup: {
                    from: 'screens',
                    localField: 'screenId',
                    foreignField: '_id',
                    as: 'screen'
                }
            },
            {
                $unwind: '$screen'
            },
            {
                $lookup: {
                    from: 'theaters',
                    localField: 'screen.theaterId',
                    foreignField: '_id',
                    as: 'theater'
                }
            },
            {
                $unwind: '$theater'
            },
            {
                $match: {
                    'theater.address.city': { $regex: city, $options: 'i' },
                    'theater.isActive': true
                }
            },
            {
                $group: {
                    _id: '$theater._id',
                    theater: { $first: '$theater' },
                    shows: {
                        $push: {
                            _id: '$_id',
                            startTime: '$startTime',
                            endTime: '$endTime',
                            price: '$price',
                            availableSeats: '$availableSeats',
                            screen: '$screen'
                        }
                    }
                }
            },
            {
                $project: {
                    theater: 1,
                    shows: 1,
                    totalShows: { $size: '$shows' }
                }
            }
        ];
        return await this.model.aggregate(pipeline);
    }

    async getAvailableSeats(showId) {
        const show = await this.model.findById(showId)
            .populate('bookedSeats.seatId');

        const totalSeats = await this.model.model('Seat')
            .countDocuments({ screenId: show.screenId });

        return {
            totalSeats,
            bookedSeats: show.bookedSeats.length,
            availableSeats: show.availableSeats,
            bookedSeatsList: show.bookedSeats
        };
    }

    async checkConflictingShow(screenId, startTime, endTime, excludeShowId = null) {
        const query = {
            screenId,
            isActive: true,
            $or: [{
                startTime: { $lt: endTime },
                endTime: { $gt: startTime }
            }]
        };

        if (excludeShowId) {
            query._id = { $ne: excludeShowId };
        }

        return await this.model.findOne(query);
    }

    async updateAvailableSeats(showId, seatsBooked, increment = false) {
        const update = increment ? { $inc: { availableSeats: seatsBooked.length } } : { $inc: { availableSeats: -seatsBooked.length } };

        return await this.model.findByIdAndUpdate(showId, update, { new: true });
    }

    async addBookedSeats(showId, seats, bookingId) {
        const seatBookings = seats.map(seat => ({
            seatId: seat.seatId,
            bookingId: bookingId
        }));

        return await this.model.findByIdAndUpdate(showId, {
            $push: { bookedSeats: { $each: seatBookings } }
        }, { new: true });
    }

    async getShowSchedule(theaterId, date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const pipeline = [{
                $match: {
                    theaterId: theaterId,
                    date: { $gte: startDate, $lte: endDate },
                    isActive: true
                }
            },
            {
                $lookup: {
                    from: 'movies',
                    localField: 'movieId',
                    foreignField: '_id',
                    as: 'movie'
                }
            },
            {
                $unwind: '$movie'
            },
            {
                $lookup: {
                    from: 'screens',
                    localField: 'screenId',
                    foreignField: '_id',
                    as: 'screen'
                }
            },
            {
                $unwind: '$screen'
            },
            {
                $sort: { startTime: 1 }
            }
        ];

        return await this.model.aggregate(pipeline);
    }
}

module.exports = new ShowRepository();