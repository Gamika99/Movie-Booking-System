const showService = require('../services/show.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class ShowController {
    createShow = asyncHandler(async(req, res) => {
        const show = await showService.createShow(req.body);

        res.status(201).json(
            ApiResponse.success(show, 'Show created successfully', 201)
        );
    });

    updateShow = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const show = await showService.updateShow(id, req.body);

        res.json(ApiResponse.success(show, 'Show updated successfully'));
    });

    deleteShow = asyncHandler(async(req, res) => {
        const { id } = req.params;
        await showService.deleteShow(id);

        res.json(ApiResponse.success(null, 'Show deleted successfully'));
    });

    getShowsByMovieCity = asyncHandler(async(req, res) => {
        const { movieId } = req.params;
        const { city, date } = req.query;

        const shows = await showService.getShowsByMovieCity(movieId, city, date);

        res.json(ApiResponse.success(shows, 'Shows retrieved successfully'));
    });

    getShowAvailability = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const availability = await showService.getShowAvailability(id);

        res.json(ApiResponse.success(availability, 'Seat availability retrieved'));
    });

    getTheaterSchedule = asyncHandler(async(req, res) => {
        const { theaterId } = req.params;
        const { date } = req.query;

        const schedule = await showService.getTheaterSchedule(theaterId, date);

        res.json(ApiResponse.success(schedule, 'Theater schedule retrieved'));
    });
}

module.exports = new ShowController();