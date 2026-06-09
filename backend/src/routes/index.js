const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./v1/auth.routes');
const movieRoutes = require('./v1/movie.routes');
const theaterRoutes = require('./v1/theater.routes');
const showRoutes = require('./v1/show.routes');
const bookingRoutes = require('./v1/booking.routes');
const userRoutes = require('./v1/user.routes');
const adminRoutes = require('./v1/admin.routes');

// Health check route (public)
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/theaters', theaterRoutes);
router.use('/shows', showRoutes);
router.use('/bookings', bookingRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Cannot find ${req.originalUrl} on this server`
    });
});

module.exports = router;