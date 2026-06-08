// backend/src/middleware/role.middleware.js
const ApiError = require('../utils/ApiError');

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Authentication required'));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, 'You do not have permission to perform this action'));
        }

        next();
    };
};

const isAdmin = authorize('admin', 'super-admin');
const isSuperAdmin = authorize('super-admin');
const isUser = authorize('user', 'admin', 'super-admin');

module.exports = {
    authorize,
    isAdmin,
    isSuperAdmin,
    isUser
};