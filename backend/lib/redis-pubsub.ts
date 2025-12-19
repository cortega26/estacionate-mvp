import { Redis } from 'ioredis';
import { logger } from './logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// We need separate connections for Pub and Sub
export const publisher = new Redis(redisUrl, { lazyConnect: true });
export const subscriber = new Redis(redisUrl, { lazyConnect: true });

publisher.on('error', (err) => logger.warn({ error: err.message }, 'Redis Publisher Error'));
subscriber.on('error', (err) => logger.warn({ error: err.message }, 'Redis Subscriber Error'));

export async function connectPubSub() {
    try {
        if (publisher.status !== 'ready') await publisher.connect();
        if (subscriber.status !== 'ready') await subscriber.connect();
        logger.info('Redis Pub/Sub connected');
    } catch (e) {
        logger.error({ err: e }, 'Failed to connect Redis Pub/Sub');
    }
}
