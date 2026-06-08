const redis = require('redis');
const logger = require('../utils/logger');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) return this.client;

        try {
            this.client = redis.createClient({
                url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
                password: process.env.REDIS_PASSWORD,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });

            this.client.on('error', (err) => {
                logger.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                logger.info('Redis Client Connected');
                this.isConnected = true;
            });

            await this.client.connect();
            return this.client;
        } catch (error) {
            logger.error('Redis connection failed:', error.message);
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        if (!this.isConnected) await this.connect();
        if (!this.client) return null;

        try {
            const serialized = JSON.stringify(value);
            await this.client.setEx(key, ttl, serialized);
            return true;
        } catch (error) {
            logger.error('Redis set error:', error);
            return false;
        }
    }

    async get(key) {
        if (!this.isConnected) await this.connect();
        if (!this.client) return null;

        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Redis get error:', error);
            return null;
        }
    }

    async del(key) {
        if (!this.isConnected) await this.connect();
        if (!this.client) return false;

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Redis delete error:', error);
            return false;
        }
    }

    async flushAll() {
        if (!this.isConnected) await this.connect();
        if (!this.client) return false;

        try {
            await this.client.flushAll();
            return true;
        } catch (error) {
            logger.error('Redis flush error:', error);
            return false;
        }
    }
}

module.exports = new RedisClient();