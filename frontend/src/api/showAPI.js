import axiosInstance from './axiosConfig';

const showAPI = {
    getShowsByMovieCity: (movieId, city, date) =>
        axiosInstance.get(`/shows/movie/${movieId}`, { params: { city, date } }),

    getTheaterSchedule: (theaterId, date) =>
        axiosInstance.get(`/shows/theater/${theaterId}/schedule`, { params: { date } }),

    getShowAvailability: (showId) =>
        axiosInstance.get(`/shows/${showId}/availability`),

    // Admin only
    createShow: (showData) => axiosInstance.post('/shows', showData),

    updateShow: (id, showData) => axiosInstance.put(`/shows/${id}`, showData),

    deleteShow: (id) => axiosInstance.delete(`/shows/${id}`),
};

export default showAPI;