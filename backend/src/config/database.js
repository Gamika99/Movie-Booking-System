const mongoose = require('mongoose');
const logger = require('../utils/logger');

class Database {
    constructor() {
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) {
            logger.info('Using existing database connection');
            return;
        }

        try {
            const options = {
                autoIndex: process.env.NODE_ENV !== 'production',
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4,
                useNewUrlParser: true,
                useUnifiedTopology: true
            };

            const mongoURI = process.env.MONGODB_URI;

            await mongoose.connect(mongoURI, options);

            this.isConnected = true;
            logger.info(`MongoDB Connected: ${mongoose.connection.host}`);

            mongoose.connection.on('error', (err) => {
                logger.error('MongoDB connection error:', err);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
                this.isConnected = false;
            });

            // Graceful shutdown
            process.on('SIGINT', async() => {
                await this.disconnect();
                process.exit(0);
            });

        } catch (error) {
            logger.error('MongoDB connection failed:', error.message);
            process.exit(1);
        }
    }

    async disconnect() {
        if (!this.isConnected) return;

        await mongoose.disconnect();
        this.isConnected = false;
        logger.info('MongoDB disconnected');
    }
}

module.exports = new Database();