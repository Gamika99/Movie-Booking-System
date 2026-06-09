const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const logger = require('../utils/logger');

class CloudinaryConfig {
    constructor() {
        this.initialize();
    }

    initialize() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
        logger.info('Cloudinary configured successfully');
    }

    async uploadImage(filePath, options = {}) {
        try {
            const result = await cloudinary.uploader.upload(filePath, {
                folder: options.folder || 'movie-booking',
                transformation: options.transformation || [
                    { width: 1200, height: 1800, crop: 'limit' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ],
                ...options
            });

            // Remove local file after upload
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            return {
                publicId: result.public_id,
                url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.bytes
            };
        } catch (error) {
            logger.error('Cloudinary upload error:', error);
            throw new Error('Failed to upload image');
        }
    }

    async deleteImage(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result.result === 'ok';
        } catch (error) {
            logger.error('Cloudinary delete error:', error);
            return false;
        }
    }

    async uploadMultipleImages(files, folder) {
        const uploadPromises = files.map(file =>
            this.uploadImage(file.path, { folder })
        );
        return await Promise.all(uploadPromises);
    }

    getOptimizedUrl(publicId, options = {}) {
        return cloudinary.url(publicId, {
            transformation: [
                { width: options.width || 800, height: options.height || 1200, crop: 'limit' },
                { quality: options.quality || 'auto' },
                { fetch_format: 'auto' }
            ]
        });
    }
}

module.exports = new CloudinaryConfig();