import { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from '../lib/redis.js';
import { db } from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            database: 'unknown',
            redis: 'unknown',
        },
    };

    try {
        // Check Database
        await db.$queryRaw`SELECT 1`;
        health.services.database = 'healthy';
    } catch (error: any) {
        health.services.database = `unhealthy: ${error.message}`;
        health.status = 'degraded';
    }

    try {
        // Check Redis
        if (redis.status === 'ready') {
            health.services.redis = 'healthy';
        } else {
            // Try a simple operation to check connectivity if status isn't explicitly 'ready'
            await redis.ping();
            health.services.redis = 'healthy';
        }
    } catch (error: any) {
        health.services.redis = `unhealthy: ${error.message}`;
        health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
}
