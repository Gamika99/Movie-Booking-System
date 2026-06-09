const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./src/app');
const database = require('./src/config/database');
const redis = require('./src/config/redis');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(err.name, err.message, err.stack);
    process.exit(1);
});

const startServer = async() => {
    try {
        // Connect to database
        await database.connect();

        // Connect to Redis
        await redis.connect();

        // Start server
        server = app.listen(PORT, () => {
            logger.info(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
            logger.info(`📡 API available at http://localhost:${PORT}/api/v1`);
            logger.info(`❤️  Health check at http://localhost:${PORT}/health`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM received. Shutting down gracefully');
    server.close(() => {
        logger.info('💥 Process terminated');
    });
});

startServer();