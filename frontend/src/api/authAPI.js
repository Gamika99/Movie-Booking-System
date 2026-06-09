import axiosInstance from './axiosConfig';

const authAPI = {
    register: (userData) => axiosInstance.post('/auth/register', userData),

    login: (credentials) => axiosInstance.post('/auth/login', credentials),

    logout: () => axiosInstance.post('/auth/logout'),

    getCurrentUser: () => axiosInstance.get('/auth/me'),

    forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),

    resetPassword: (data) => axiosInstance.post('/auth/reset-password', data),

    changePassword: (data) => axiosInstance.post('/auth/change-password', data),

    refreshToken: (refreshToken) => axiosInstance.post('/auth/refresh-token', { refreshToken }),

    verifyEmail: (token) => axiosInstance.get(`/auth/verify-email/${token}`),

    resendVerification: (email) => axiosInstance.post('/auth/resend-verification', { email }),
};

export default authAPI;