import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../lib/db.js'
import { redis } from '../lib/redis.js'
import { logger } from '../lib/logger.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

    const health = {
        database: 'unknown',
        redis: 'unknown',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    };

    let status = 200;

    // Check Database
    try {
        await db.$queryRaw`SELECT 1`;
        health.database = 'connected';
    } catch (error: unknown) {
        health.database = 'disconnected';
        const msg = error instanceof Error ? error.message : String(error)
        logger.error({ error: msg }, 'Health Check: database fail');
        status = 503;
    }

    // Check Redis
    try {
        if (redis.status === 'ready') {
            await redis.ping();
            health.redis = 'connected';
        } else {
            health.redis = `disconnected (${redis.status})`;
            status = 503;
        }
    } catch (error: unknown) {
        health.redis = 'error';
        const msg = error instanceof Error ? error.message : String(error)
        logger.error({ error: msg }, 'Health Check: redis fail');
        status = 503;
    }

    res.status(status).json(health);
}
