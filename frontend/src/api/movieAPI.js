import axiosInstance from './axiosConfig';

const movieAPI = {
    getMovies: (params) => axiosInstance.get('/movies', { params }),

    getNowShowing: (limit) => axiosInstance.get('/movies/now-showing', { params: { limit } }),

    getUpcoming: (limit) => axiosInstance.get('/movies/upcoming', { params: { limit } }),

    getMovieById: (id) => axiosInstance.get(`/movies/${id}`),

    searchMovies: (query) => axiosInstance.get('/movies/search', { params: query }),

    getMoviesByCity: (city, date) => axiosInstance.get('/movies/by-city', { params: { city, date } }),

    // Admin only
    createMovie: (movieData) => {
        const formData = new FormData();
        formData.append('movieData', JSON.stringify(movieData));
        if (movieData.poster) {
            formData.append('poster', movieData.poster);
        }
        return axiosInstance.post('/movies', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    updateMovie: (id, movieData) => {
        const formData = new FormData();
        formData.append('movieData', JSON.stringify(movieData));
        if (movieData.poster) {
            formData.append('poster', movieData.poster);
        }
        return axiosInstance.put(`/movies/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    deleteMovie: (id) => axiosInstance.delete(`/movies/${id}`),
};

export default movieAPI;