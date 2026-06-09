const theaterService = require('../services/theater.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class TheaterController {
    createTheater = asyncHandler(async(req, res) => {
        const theaterData = JSON.parse(req.body.theaterData || '{}');
        const images = req.files;

        const theater = await theaterService.createTheater(theaterData, images);

        res.status(201).json(
            ApiResponse.success(theater, 'Theater created successfully', 201)
        );
    });

    updateTheater = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const updateData = JSON.parse(req.body.theaterData || '{}');
        const newImages = req.files;

        const theater = await theaterService.updateTheater(id, updateData, newImages);

        res.json(ApiResponse.success(theater, 'Theater updated successfully'));
    });

    deleteTheater = asyncHandler(async(req, res) => {
        const { id } = req.params;
        await theaterService.deleteTheater(id);

        res.json(ApiResponse.success(null, 'Theater deleted successfully'));
    });

    getTheatersByCity = asyncHandler(async(req, res) => {
        const { city } = req.params;
        const { facility } = req.query;

        const theaters = await theaterService.getTheatersByCity(city, { hasFacility: facility });

        res.json(ApiResponse.success(theaters, 'Theaters retrieved successfully'));
    });

    getTheaterDetails = asyncHandler(async(req, res) => {
        const { id } = req.params;
        const theater = await theaterService.getTheaterWithScreens(id);

        res.json(ApiResponse.success(theater, 'Theater details retrieved'));
    });
}

module.exports = new TheaterController();