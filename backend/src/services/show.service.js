const showRepository = require('../repositories/show.repository');
const movieRepository = require('../repositories/movie.repository');
const screenRepository = require('../repositories/screen.repository');
const theaterRepository = require('../repositories/theater.repository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

class ShowService {
    async createShow(showData) {
        // Validate movie
        const movie = await movieRepository.findById(showData.movieId);
        if (!movie) {
            throw new ApiError(404, 'Movie not found');
        }

        // Validate screen
        const screen = await screenRepository.findById(showData.screenId);
        if (!screen) {
            throw new ApiError(404, 'Screen not found');
        }

        // Calculate end time based on movie duration
        const startTime = new Date(showData.startTime);
        const endTime = new Date(startTime.getTime() + movie.duration * 60000);

        // Check for conflicting shows
        const conflicting = await showRepository.checkConflictingShow(
            showData.screenId,
            startTime,
            endTime
        );

        if (conflicting) {
            throw new ApiError(400, 'Another show is scheduled at this time on this screen');
        }

        // Get total seats from screen
        const Seat = require('../models/seat.model');
        const totalSeats = await Seat.countDocuments({ screenId: showData.screenId });

        const show = await showRepository.create({
            ...showData,
            endTime,
            availableSeats: totalSeats,
            theaterId: screen.theaterId
        });

        await this.clearShowCache();
        logger.info(`Show created for movie "${movie.title}" on screen ${screen.name}`);

        return show;
    }

    async updateShow(showId, updateData) {
        const show = await showRepository.findById(showId);
        if (!show) {
            throw new ApiError(404, 'Show not found');
        }

        // If changing time, check for conflicts
        if (updateData.startTime) {
            const movie = await movieRepository.findById(show.movieId);
            const newStartTime = new Date(updateData.startTime);
            const newEndTime = new Date(newStartTime.getTime() + movie.duration * 60000);

            const conflicting = await showRepository.checkConflictingShow(
                show.screenId,
                newStartTime,
                newEndTime,
                showId
            );

            if (conflicting) {
                throw new ApiError(400, 'Another show is scheduled at this time on this screen');
            }

            updateData.endTime = newEndTime;
        }

        const updated = await showRepository.update(showId, updateData);
        await this.clearShowCache(showId);

        return updated;
    }

    async deleteShow(showId) {
        const show = await showRepository.findById(showId);
        if (!show) {
            throw new ApiError(404, 'Show not found');
        }

        // Check if has any bookings
        const Booking = require('../models/booking.model');
        const hasBookings = await Booking.exists({ showId, status: 'confirmed' });

        if (hasBookings) {
            throw new ApiError(400, 'Cannot delete show with confirmed bookings');
        }

        await showRepository.update(showId, { isActive: false });
        await this.clearShowCache(showId);

        logger.info(`Show soft-deleted: ${showId}`);
        return true;
    }

    async getShowsByMovieCity(movieId, city, date) {
        const cacheKey = `shows:${movieId}:${city}:${date}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const shows = await showRepository.findShowsByMovieAndCity(movieId, city, date);
        await redisClient.set(cacheKey, shows, 900); // Cache for 15 minutes

        return shows;
    }

    async getShowAvailability(showId) {
        return await showRepository.getAvailableSeats(showId);
    }

    async getTheaterSchedule(theaterId, date) {
        return await showRepository.getShowSchedule(theaterId, date);
    }

    async clearShowCache(showId = null) {
        if (showId) {
            await redisClient.del(`show:${showId}`);
        }

        const keys = await redisClient.client ?
            await redisClient.client.keys('shows:*') : [];

        for (const key of keys) {
            await redisClient.del(key);
        }
    }
}

module.exports = new ShowService();