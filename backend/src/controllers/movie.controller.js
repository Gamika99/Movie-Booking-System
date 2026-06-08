const movieService = require('../services/movie.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class MovieController {
    createMovie = asyncHandler(async(req, res) => {
        const movieData = JSON.parse(req.body.movieData || '{}');
        const posterFile = req.file;

        const movie = await movieService.createMovie(movieData, posterFile);

        res.status(201).json(
            ApiResponse.success(movie, 'Movie created successfully', 201)
        );
    });

    updateMovie = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const updateData = JSON.parse(req.body.movieData || '{}');
        const posterFile = req.file;

        const movie = await movieService.updateMovie(id, updateData, posterFile);

        res.json(ApiResponse.success(movie, 'Movie updated successfully'));
    });

    deleteMovie = asyncHandler(async(req, res) => {
        const { id } = req.params;
        await movieService.deleteMovie(id);

        res.json(ApiResponse.success(null, 'Movie deleted successfully'));
    });

    getMovieById = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const movie = await movieService.getMovieById(id);

        res.json(ApiResponse.success(movie, 'Movie retrieved successfully'));
    });

    getAllMovies = asyncHandler(async(req, res) => {
        const {
            page = 1,
                limit = 10,
                status,
                genre,
                language,
                search
        } = req.query;

        const movies = await movieService.getAllMovies({ status, genre, language, search }, { page: parseInt(page), limit: parseInt(limit) });

        res.json(ApiResponse.success(movies, 'Movies retrieved successfully'));
    });

    getNowShowing = asyncHandler(async(req, res) => {
        const { limit = 10 } = req.query;
        const movies = await movieService.getNowShowingMovies(parseInt(limit));

        res.json(ApiResponse.success(movies, 'Now showing movies retrieved'));
    });

    getUpcoming = asyncHandler(async(req, res) => {
        const { limit = 10 } = req.query;
        const movies = await movieService.getUpcomingMovies(parseInt(limit));

        res.json(ApiResponse.success(movies, 'Upcoming movies retrieved'));
    });

    searchMovies = asyncHandler(async(req, res) => {
        const { q, genre, language, status } = req.query;
        const movies = await movieService.searchMovies(q, { genre, language, status });

        res.json(ApiResponse.success(movies, 'Search results retrieved'));
    });

    getMoviesByCity = asyncHandler(async(req, res) => {
        const { city, date } = req.query;
        const movies = await movieService.getMoviesByCity(city, date);

        res.json(ApiResponse.success(movies, 'Movies by city retrieved'));
    });
}

module.exports = new MovieController();