const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const redisClient = require('../config/redis');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const protect = asyncHandler(async(req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies (optional)
    if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw new ApiError(401, 'You are not logged in. Please log in to access this resource');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if token is blacklisted
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new ApiError(401, 'Token has been invalidated. Please log in again');
        }

        // Get user from database
        const user = await userRepository.findById(decoded.id);

        if (!user) {
            throw new ApiError(401, 'The user belonging to this token no longer exists');
        }

        // Check if user is blocked
        if (user.isBlocked) {
            throw new ApiError(403, 'Your account has been blocked. Please contact support');
        }

        // Check if password was changed after token issuance
        if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
            throw new ApiError(401, 'Password was recently changed. Please log in again');
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, 'Invalid token. Please log in again');
        } else if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, 'Token expired. Please log in again');
        }
        throw error;
    }
});

const optionalAuth = asyncHandler(async(req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userRepository.findById(decoded.id);
            if (user && !user.isBlocked) {
                req.user = user;
                req.userId = user._id;
            }
        } catch (error) {
            // Ignore token errors for optional auth
            logger.debug('Optional auth failed:', error.message);
        }
    }

    next();
});

module.exports = {
    protect,
    optionalAuth
};