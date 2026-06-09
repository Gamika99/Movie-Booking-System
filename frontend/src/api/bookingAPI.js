import axiosInstance from './axiosConfig';

const bookingAPI = {
    initiateBooking: (bookingData) => axiosInstance.post('/bookings/initiate', bookingData),

    confirmBooking: (bookingId, paymentDetails) =>
        axiosInstance.post(`/bookings/${bookingId}/confirm`, paymentDetails),

    cancelBooking: (bookingId, reason) =>
        axiosInstance.post(`/bookings/${bookingId}/cancel`, { reason }),

    getMyBookings: (params) => axiosInstance.get('/bookings/my-bookings', { params }),

    getBookingDetails: (bookingId) => axiosInstance.get(`/bookings/${bookingId}`),

    getBookingStats: (startDate, endDate) =>
        axiosInstance.get('/bookings/stats/all', { params: { startDate, endDate } }),
};

export default bookingAPI;