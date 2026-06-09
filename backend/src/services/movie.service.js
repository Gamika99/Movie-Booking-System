const movieRepository = require('../repositories/movie.repository');
const uploadService = require('./upload.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

class MovieService {
    async createMovie(movieData, posterFile) {
        // Check for duplicate movie
        const existingMovie = await movieRepository.findOne({
            title: movieData.title,
            releaseDate: movieData.releaseDate
        });

        if (existingMovie) {
            throw new ApiError(400, 'Movie already exists with this title and release date');
        }

        // Upload poster if provided
        let posterUrl = null;
        if (posterFile) {
            const uploadResult = await uploadService.uploadMoviePoster(posterFile);
            posterUrl = uploadResult.url;
        }

        // Set status based on release date
        const now = new Date();
        const releaseDate = new Date(movieData.releaseDate);
        const endDate = new Date(movieData.endDate);

        let status = 'coming-soon';
        let isNowShowing = false;
        let isUpcoming = true;

        if (releaseDate <= now && endDate >= now) {
            status = 'now-showing';
            isNowShowing = true;
            isUpcoming = false;
        } else if (releaseDate > now) {
            status = 'coming-soon';
            isNowShowing = false;
            isUpcoming = true;
        } else if (endDate < now) {
            status = 'ended';
            isNowShowing = false;
            isUpcoming = false;
        }

        const movie = await movieRepository.create({
            ...movieData,
            poster: posterUrl,
            status,
            isNowShowing,
            isUpcoming
        });

        // Clear cache
        await this.clearMovieCache();

        logger.info(`Movie created: ${movie.title} by ${movieData.createdBy}`);
        return movie;
    }

    async updateMovie(movieId, updateData, posterFile) {
        const movie = await movieRepository.findById(movieId);
        if (!movie) {
            throw new ApiError(404, 'Movie not found');
        }

        // Upload new poster if provided
        if (posterFile) {
            // Delete old poster from cloudinary
            if (movie.poster && movie.poster.includes('cloudinary')) {
                const publicId = movie.poster.split('/').slice(-2).join('/').split('.')[0];
                await uploadService.deleteImage(publicId);
            }

            const uploadResult = await uploadService.uploadMoviePoster(posterFile);
            updateData.poster = uploadResult.url;
        }

        // Update status based on dates if changed
        if (updateData.releaseDate || updateData.endDate) {
            const now = new Date();
            const releaseDate = new Date(updateData.releaseDate || movie.releaseDate);
            const endDate = new Date(updateData.endDate || movie.endDate);

            if (releaseDate <= now && endDate >= now) {
                updateData.status = 'now-showing';
                updateData.isNowShowing = true;
                updateData.isUpcoming = false;
            } else if (releaseDate > now) {
                updateData.status = 'coming-soon';
                updateData.isNowShowing = false;
                updateData.isUpcoming = true;
            } else if (endDate < now) {
                updateData.status = 'ended';
                updateData.isNowShowing = false;
                updateData.isUpcoming = false;
            }
        }

        const updatedMovie = await movieRepository.update(movieId, updateData);

        // Clear cache
        await this.clearMovieCache(movieId);

        logger.info(`Movie updated: ${updatedMovie.title}`);
        return updatedMovie;
    }

    async deleteMovie(movieId) {
        const movie = await movieRepository.findById(movieId);
        if (!movie) {
            throw new ApiError(404, 'Movie not found');
        }

        // Check if movie has any shows
        const Show = require('../models/show.model');
        const hasShows = await Show.exists({ movieId, isActive: true });

        if (hasShows) {
            throw new ApiError(400, 'Cannot delete movie with active shows');
        }

        // Delete poster from cloudinary
        if (movie.poster && movie.poster.includes('cloudinary')) {
            const publicId = movie.poster.split('/').slice(-2).join('/').split('.')[0];
            await uploadService.deleteImage(publicId);
        }

        await movieRepository.delete(movieId);

        // Clear cache
        await this.clearMovieCache(movieId);

        logger.info(`Movie deleted: ${movie.title}`);
        return true;
    }

    async getMovieById(movieId) {
        // Check cache first
        const cacheKey = `movie:${movieId}`;
        const cachedMovie = await redisClient.get(cacheKey);

        if (cachedMovie) {
            return cachedMovie;
        }

        const movie = await movieRepository.findById(movieId);
        if (!movie) {
            throw new ApiError(404, 'Movie not found');
        }

        // Cache for 1 hour
        await redisClient.set(cacheKey, movie, 3600);

        return movie;
    }

    async getAllMovies(filters, pagination) {
        const cacheKey = `movies:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
        const cachedResult = await redisClient.get(cacheKey);

        if (cachedResult) {
            return cachedResult;
        }

        const query = {};

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.genre) {
            query.genre = { $in: [filters.genre] };
        }

        if (filters.language) {
            query.language = { $in: [filters.language] };
        }

        if (filters.search) {
            query.title = { $regex: filters.search, $options: 'i' };
        }

        const result = await movieRepository.findAll(query, pagination);

        // Cache for 30 minutes
        await redisClient.set(cacheKey, result, 1800);

        return result;
    }

    async getNowShowingMovies(limit = 10) {
        const cacheKey = `movies:now-showing:${limit}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const movies = await movieRepository.findNowShowing(limit);
        await redisClient.set(cacheKey, movies, 1800);

        return movies;
    }

    async getUpcomingMovies(limit = 10) {
        const cacheKey = `movies:upcoming:${limit}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) return cached;

        const movies = await movieRepository.findUpcoming(limit);
        await redisClient.set(cacheKey, movies, 3600);

        return movies;
    }

    async searchMovies(keyword, filters) {
        return await movieRepository.searchMovies(keyword, filters);
    }

    async getMoviesByCity(city, date) {
        return await movieRepository.getMoviesByCity(city, date);
    }

    async clearMovieCache(movieId = null) {
        if (movieId) {
            await redisClient.del(`movie:${movieId}`);
        }

        // Clear all movie list caches
        const keys = await redisClient.client ?
            await redisClient.client.keys('movies:*') : [];

        for (const key of keys) {
            await redisClient.del(key);
        }

        await redisClient.del('movies:now-showing:*');
        await redisClient.del('movies:upcoming:*');
    }
}

module.exports = new MovieService();