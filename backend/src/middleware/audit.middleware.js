const logger = require('../utils/logger');

const auditLog = (action, resourceType) => {
    return async(req, res, next) => {
        const originalJson = res.json;

        res.json = function(data) {
            const auditData = {
                action,
                resourceType,
                resourceId: req.params.id || req.body.id,
                userId: req.userId,
                userRole: req.userRole,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date(),
                requestBody: req.body,
                responseStatus: res.statusCode,
                responseData: data
            };

            logger.info('AUDIT', auditData);

            originalJson.call(this, data);
        };

        next();
    };
};

module.exports = { auditLog };