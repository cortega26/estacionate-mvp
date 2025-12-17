import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { AppError, ErrorCode } from '../lib/errors.js';

interface RateLimitConfig {
    windowMs: number;
    max: number;
    keyPrefix: string;
}

export function createRateLimiter(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // If Redis is down/null, fail open (allow request) but log warning
        if (redis.status !== 'ready') {
            return next();
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const key = `ratelimit:${config.keyPrefix}:${ip}`;

        try {
            const requests = await redis.incr(key);

            if (requests === 1) {
                await redis.expire(key, Math.ceil(config.windowMs / 1000));
            }

            if (requests > config.max) {
                logger.warn({ ip, prefix: config.keyPrefix }, 'Rate limit exceeded');
                return res.status(429).json({
                    error: 'Too many requests, please try again later.',
                    code: 'RATE_LIMIT_EXCEEDED'
                });
            }

            next();
        } catch (error) {
            logger.error({ err: error }, 'Rate limiter error');
            // Fail open
            next();
        }
    };
}

// Standard Limits
export const generalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    keyPrefix: 'general'
});

export const authLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 attempts per minute
    keyPrefix: 'auth'
});
