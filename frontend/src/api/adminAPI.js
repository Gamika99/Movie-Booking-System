import axiosInstance from './axiosConfig';

const adminAPI = {
    // Dashboard
    getDashboardStats: () => axiosInstance.get('/admin/dashboard'),

    getRecentActivity: (limit) => axiosInstance.get('/admin/activity', { params: { limit } }),

    getSystemHealth: () => axiosInstance.get('/admin/health'),

    clearCache: () => axiosInstance.post('/admin/cache/clear'),

    // User Management
    getAllUsers: (params) => axiosInstance.get('/users', { params }),

    getUserById: (id) => axiosInstance.get(`/users/${id}`),

    updateUser: (id, userData) => axiosInstance.put(`/users/${id}`, userData),

    blockUser: (id) => axiosInstance.post(`/users/${id}/block`),

    unblockUser: (id) => axiosInstance.post(`/users/${id}/unblock`),

    deleteUser: (id) => axiosInstance.delete(`/users/${id}`),

    changeUserRole: (id, role) => axiosInstance.put(`/users/${id}/role`, { role }),

    getUserStats: () => axiosInstance.get('/users/stats'),

    // Analytics
    getRevenueAnalytics: (startDate, endDate, groupBy) =>
        axiosInstance.get('/admin/analytics/revenue', { params: { startDate, endDate, groupBy } }),

    getMovieAnalytics: (startDate, endDate) =>
        axiosInstance.get('/admin/analytics/movies', { params: { startDate, endDate } }),

    getUserAnalytics: (startDate, endDate) =>
        axiosInstance.get('/admin/analytics/users', { params: { startDate, endDate } }),

    getTheaterAnalytics: (startDate, endDate) =>
        axiosInstance.get('/admin/analytics/theaters', { params: { startDate, endDate } }),

    // Reports
    downloadBookingReport: (startDate, endDate, format) =>
        axiosInstance.get('/admin/reports/bookings', {
            params: { startDate, endDate, format },
            responseType: 'blob',
        }),

    downloadRevenueReport: (startDate, endDate) =>
        axiosInstance.get('/admin/reports/revenue', {
            params: { startDate, endDate },
            responseType: 'blob',
        }),
};

export default adminAPI;