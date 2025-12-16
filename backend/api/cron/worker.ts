import type { VercelRequest, VercelResponse } from '@vercel/node'
import { QueueService } from '../../services/QueueService.js'
import { logger } from '../../lib/logger.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Basic Security: Allow localhost or Verification Header from Vercel Cron
    // For MVP, we'll keep it open but log access.
    logger.info('[Worker] Triggered');

    try {
        const result = await QueueService.processNextBatch();
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        logger.error({ err: error }, '[Worker] Error');
        return res.status(500).json({ error: 'Worker Failed' });
    }
}
