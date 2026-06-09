const theaterRepository = require('../repositories/theater.repository');
const screenRepository = require('../repositories/screen.repository');
const uploadService = require('./upload.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

class TheaterService {
    async createTheater(theaterData, images = []) {
        // Check duplicate
        const existing = await theaterRepository.findOne({
            name: theaterData.name,
            'address.city': theaterData.address.city
        });

        if (existing) {
            throw new ApiError(400, 'Theater already exists in this city');
        }

        // Upload images
        const uploadedImages = [];
        if (images.length > 0) {
            for (const image of images) {
                const result = await uploadService.uploadTheaterImage(image);
                uploadedImages.push(result.url);
            }
        }

        const theater = await theaterRepository.create({
            ...theaterData,
            images: uploadedImages
        });

        await this.clearTheaterCache();
        logger.info(`Theater created: ${theater.name} in ${theater.address.city}`);

        return theater;
    }

    async updateTheater(theaterId, updateData, newImages = []) {
        const theater = await theaterRepository.findById(theaterId);
        if (!theater) {
            throw new ApiError(404, 'Theater not found');
        }

        // Upload new images
        if (newImages.length > 0) {
            const uploadedImages = [];
            for (const image of newImages) {
                const result = await uploadService.uploadTheaterImage(image);
                uploadedImages.push(result.url);
            }
            updateData.images = [...theater.images, ...uploadedImages];
        }

        const updated = await theaterRepository.update(theaterId, updateData);
        await this.clearTheaterCache(theaterId);

        return updated;
    }

    async deleteTheater(theaterId) {
        const theater = await theaterRepository.findById(theaterId);
        if (!theater) {
            throw new ApiError(404, 'Theater not found');
        }

        // Check if has screens
        const screens = await screenRepository.findByTheater(theaterId);
        if (screens.length > 0) {
            throw new ApiError(400, 'Cannot delete theater with existing screens');
        }

        await theaterRepository.delete(theaterId);
        await this.clearTheaterCache(theaterId);

        return true;
    }

    async getTheatersByCity(city, filters) {
        const cacheKey = `theaters:city:${city}:${JSON.stringify(filters)}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const theaters = await theaterRepository.findByCity(city, filters);
        await redisClient.set(cacheKey, theaters, 1800);

        return theaters;
    }

    async getTheaterWithScreens(theaterId) {
        const theater = await theaterRepository.findById(theaterId);
        if (!theater) {
            throw new ApiError(404, 'Theater not found');
        }

        const screens = await screenRepository.findByTheater(theaterId);

        return {
            ...theater.toObject(),
            screens
        };
    }

    async clearTheaterCache(theaterId = null) {
        if (theaterId) {
            await redisClient.del(`theater:${theaterId}`);
        }

        const keys = await redisClient.client ?
            await redisClient.client.keys('theaters:*') : [];

        for (const key of keys) {
            await redisClient.del(key);
        }
    }
}

module.exports = new TheaterService();