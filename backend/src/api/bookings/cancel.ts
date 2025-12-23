import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import cors from '../../lib/cors.js';
import { logger } from '../../lib/logger.js';
import { BookingService } from '../../services/BookingService.js';
import { verifyToken } from '../../services/auth.js';


export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const schema = z.object({
            bookingId: z.string().uuid()
        });

        const body = schema.parse(req.body);

        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

        // Use static import
        const user = verifyToken(authHeader.replace('Bearer ', ''));
        if (!user) return res.status(401).json({ error: 'Invalid Token' });

        const result = await BookingService.cancelBooking(body.bookingId, user.userId, user.role || '');

        return res.status(200).json(result);

    } catch (error) {
        logger.error(error, '[CancelBooking] Error');
        if ((error as Error).message === 'UNAUTHORIZED_CANCELLATION') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
