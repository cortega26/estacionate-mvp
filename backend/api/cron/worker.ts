import type { VercelRequest, VercelResponse } from '@vercel/node'
import { logger } from '../../lib/logger.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Basic Security: Allow localhost or Verification Header from Vercel Cron
    // For MVP, we'll keep it open but log access.
    logger.info('[Worker] Triggered (No-op: QeueueService removed)');

    return res.status(200).json({ success: true, processed: 0 });
}
