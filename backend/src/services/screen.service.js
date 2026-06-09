const screenRepository = require('../repositories/screen.repository');
const theaterRepository = require('../repositories/theater.repository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class ScreenService {
    async createScreen(screenData, seatLayout) {
        // Verify theater exists
        const theater = await theaterRepository.findById(screenData.theaterId);
        if (!theater) {
            throw new ApiError(404, 'Theater not found');
        }

        // Check duplicate screen name in theater
        const existing = await screenRepository.findOne({
            name: screenData.name,
            theaterId: screenData.theaterId
        });

        if (existing) {
            throw new ApiError(400, 'Screen with this name already exists in the theater');
        }

        // Create screen with seats
        const screen = await screenRepository.createScreenWithSeats(screenData, seatLayout);

        logger.info(`Screen created: ${screen.name} in theater ${theater.name}`);
        return screen;
    }

    async updateScreen(screenId, updateData) {
        const screen = await screenRepository.findById(screenId);
        if (!screen) {
            throw new ApiError(404, 'Screen not found');
        }

        // Don't allow changing theater
        delete updateData.theaterId;

        const updated = await screenRepository.update(screenId, updateData);
        logger.info(`Screen updated: ${updated.name}`);

        return updated;
    }

    async deleteScreen(screenId) {
        const screen = await screenRepository.findById(screenId);
        if (!screen) {
            throw new ApiError(404, 'Screen not found');
        }

        // Check if has shows
        const Show = require('../models/show.model');
        const hasShows = await Show.exists({ screenId, isActive: true });

        if (hasShows) {
            throw new ApiError(400, 'Cannot delete screen with active shows');
        }

        // Delete all seats for this screen
        const Seat = require('../models/seat.model');
        await Seat.deleteMany({ screenId });

        await screenRepository.delete(screenId);
        logger.info(`Screen deleted: ${screen.name}`);

        return true;
    }

    async getScreensByTheater(theaterId) {
        const theater = await theaterRepository.findById(theaterId);
        if (!theater) {
            throw new ApiError(404, 'Theater not found');
        }

        return await screenRepository.findByTheater(theaterId);
    }

    async getScreenWithDetails(screenId) {
        const screen = await screenRepository.getScreenWithSeats(screenId);
        if (!screen) {
            throw new ApiError(404, 'Screen not found');
        }

        return screen;
    }
}

module.exports = new ScreenService();