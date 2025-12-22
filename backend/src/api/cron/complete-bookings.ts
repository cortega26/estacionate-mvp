import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';

/**
 * CRON: Completes bookings that have physically ended.
 * Moves BookingStatus from 'confirmed' -> 'completed'.
 * This should run e.g. every hour.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const now = new Date();

    try {
        const result = await db.$transaction(async (tx) => {
            // Find confirmed bookings where endDatetime < now
            // We need to join with AvailabilityBlock to check the date

            // 1. Update status to 'completed'
            // We can do this in a single updateMany providing we can filter by relation.
            // Prisma supports relation filtering in updateMany? No, inconsistent support for some DBs.
            // Safer to find IDs first.

            const bookingsToComplete = await tx.booking.findMany({
                where: {
                    status: 'confirmed',
                    availabilityBlock: {
                        endDatetime: {
                            lt: now
                        }
                    }
                },
                select: { id: true }
            });

            if (bookingsToComplete.length === 0) return { count: 0 };

            const ids = bookingsToComplete.map(b => b.id);

            const updateResult = await tx.booking.updateMany({
                where: {
                    id: { in: ids }
                },
                data: {
                    status: 'completed',
                    updatedAt: new Date()
                }
            });

            return { count: updateResult.count };
        });

        if (result.count > 0) {
            logger.info({ count: result.count }, `[CRON] Auto-completed past bookings`);
        }

        return res.status(200).json({ success: true, completed: result.count });

    } catch (error) {
        logger.error({ error }, 'Failed to complete bookings');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
