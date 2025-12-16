import { db } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import { NotificationService } from './NotificationService.js';
import { Job, JobStatus } from '@prisma/client';

export class QueueService {
    static async add(type: string, payload: any) {
        try {
            const job = await db.job.create({
                data: {
                    type,
                    payload
                }
            });
            logger.info(`[Queue] Job added: ${job.id} (${type})`);
            return job;
        } catch (error) {
            logger.error('[Queue] Failed to add job', error);
            throw error;
        }
    }

    static async processNextBatch(limit = 10) {
        // 1. Fetch Pending Jobs
        const jobs = await db.job.findMany({
            where: {
                status: 'PENDING',
                runAt: { lte: new Date() }
            },
            take: limit,
            orderBy: { runAt: 'asc' }
        });

        if (jobs.length === 0) return { processed: 0 };

        logger.info(`[Queue] Processing ${jobs.length} jobs...`);

        // 2. Process Each
        const results = await Promise.allSettled(jobs.map(job => this.processJob(job)));

        return {
            processed: jobs.length,
            results: results.map(r => r.status)
        };
    }

    private static async processJob(job: Job) {
        // Mark as Processing (Optional for simple locking, skipping for simplicity in MVP invalidation)
        // Ideally we'd lock the row, but for this MVP we'll just process.

        try {
            await this.executeHandler(job);

            // Success
            await db.job.update({
                where: { id: job.id },
                data: { status: 'COMPLETED' }
            });
            logger.info(`[Queue] Job COMPLETED: ${job.id}`);

        } catch (error: any) {
            // Failure
            logger.error(`[Queue] Job FAILED: ${job.id}`, error);

            const nextAttempt = job.attempts + 1;
            const maxAttempts = 3;

            if (nextAttempt >= maxAttempts) {
                // Fatal Failure
                await db.job.update({
                    where: { id: job.id },
                    data: {
                        status: 'FAILED',
                        lastError: error.message || 'Unknown error',
                        attempts: nextAttempt
                    }
                });
            } else {
                // Retry with Exponential Backoff (1m, 5m, etc.)
                const delayMinutes = Math.pow(2, nextAttempt); // 2, 4, 8...
                const nextRunAt = new Date(Date.now() + delayMinutes * 60 * 1000);

                await db.job.update({
                    where: { id: job.id },
                    data: {
                        status: 'PENDING', // Ready for next pick up
                        attempts: nextAttempt,
                        lastError: error.message || 'Unknown error',
                        runAt: nextRunAt
                    }
                });
                logger.info(`[Queue] Job RETRY scheduled: ${job.id} for ${nextRunAt.toISOString()}`);
            }
        }
    }

    private static async executeHandler(job: Job) {
        const payload = job.payload as any;

        switch (job.type) {
            case 'SEND_WHATSAPP':
                // We call the basic sending method. 
                // Currently NotificationService.sendWhatsAppMessage handles the logic.
                // We might need to handle specific templates here.
                if (payload.phone && payload.message) {
                    await NotificationService.sendWhatsAppMessage(payload.phone, payload.message);
                }
                break;

            default:
                throw new Error(`Unknown Job Type: ${job.type}`);
        }
    }
}
