import type { VercelRequest, VercelResponse } from '@vercel/node'
import { logger } from '../../lib/logger.js'
import { verifyCronSecret } from '../../lib/cronAuth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!verifyCronSecret(req as any)) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    logger.info('[Worker] Triggered (No-op: QueueService removed)');

    return res.status(200).json({ success: true, processed: 0 });
}
