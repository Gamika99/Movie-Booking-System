const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class UploadService {
    async uploadMoviePoster(file) {
        try {
            const result = await cloudinary.uploadImage(file.path, {
                folder: 'movie-booking/posters',
                transformation: [
                    { width: 500, height: 750, crop: 'fill' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            });

            return {
                url: result.url,
                publicId: result.publicId
            };
        } catch (error) {
            logger.error('Movie poster upload failed:', error);
            throw new Error('Failed to upload movie poster');
        }
    }

    async uploadTheaterImage(file) {
        try {
            const result = await cloudinary.uploadImage(file.path, {
                folder: 'movie-booking/theaters',
                transformation: [
                    { width: 1200, height: 800, crop: 'fill' },
                    { quality: 'auto' }
                ]
            });

            return {
                url: result.url,
                publicId: result.publicId
            };
        } catch (error) {
            logger.error('Theater image upload failed:', error);
            throw new Error('Failed to upload theater image');
        }
    }

    async uploadMultipleImages(files, folder) {
        const uploadPromises = files.map(file =>
            cloudinary.uploadImage(file.path, { folder })
        );
        return await Promise.all(uploadPromises);
    }

    async deleteImage(publicId) {
        return await cloudinary.deleteImage(publicId);
    }

    cleanupTempFiles(directory = 'uploads/temp') {
        const files = fs.readdirSync(directory);
        const now = Date.now();

        files.forEach(file => {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);
            const ageInHours = (now - stats.ctimeMs) / (1000 * 60 * 60);

            // Delete files older than 24 hours
            if (ageInHours > 24) {
                fs.unlinkSync(filePath);
                logger.info(`Deleted old temp file: ${file}`);
            }
        });
    }
}

module.exports = new UploadService();