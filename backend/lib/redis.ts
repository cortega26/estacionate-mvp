import Redis from 'ioredis';
import { logger } from './logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
    },
});

redis.on('error', (err) => {
    // Suppress unhandled error events to prevent crash if Redis is down
    logger.warn('Redis error', { error: err.message });
});

redis.on('connect', () => {
    logger.info('Redis connected');
});
