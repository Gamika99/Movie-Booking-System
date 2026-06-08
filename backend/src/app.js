const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/error.middleware');
const routes = require('./routes');

class App {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        // Compression
        this.app.use(compression());

        // Logging
        if (process.env.NODE_ENV === 'development') {
            this.app.use(morgan('dev'));
        } else {
            this.app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
        }

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Data sanitization against NoSQL injection
        this.app.use(mongoSanitize());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: process.env.RATE_LIMIT_WINDOW_MS * 1000 || 15 * 60 * 1000,
            max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api', limiter);

        // Static files
        this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    }

    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'success',
                message: 'Server is running',
                timestamp: new Date().toISOString()
            });
        });

        this.app.use('/api/v1', routes);

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                status: 'error',
                message: `Cannot find ${req.originalUrl} on this server`
            });
        });
    }

    setupErrorHandling() {
        this.app.use(errorHandler);
    }

    getApp() {
        return this.app;
    }
}

module.exports = new App().getApp();