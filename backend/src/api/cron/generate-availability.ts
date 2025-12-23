import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';
import { DurationType } from '@prisma/client';
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds, isBefore } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Santiago';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Security: Validate Cron Secret if needed (Vercel protects cron paths, but good practice)
    // const authHeader = req.headers['authorization'];
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... } 
    // For MVP/Vercel Cron internal requests, we can rely on path secrecy or Vercel's protection.

    logger.info('[Availability Job] Starting generation...');

    try {
        const spots = await db.visitorSpot.findMany({
            where: { isActive: true },
            select: { id: true }
        });

        logger.info(`[Availability Job] Found ${spots.length} active spots.`);

        if (spots.length === 0) {
            return res.status(200).json({ success: true, created: 0, skipped: 0 });
        }

        const now = new Date();
        const today = toZonedTime(now, TIMEZONE);
        const windowStart = today;
        const windowEnd = addDays(today, 32); // Slightly larger buffer

        // 1. Batch Fetch Existing Blocks
        const spotIds = spots.map(s => s.id);
        const existingBlocks = await db.availabilityBlock.findMany({
            where: {
                spotId: { in: spotIds },
                startDatetime: { gte: windowStart, lte: windowEnd }
            },
            select: {
                spotId: true,
                startDatetime: true,
                endDatetime: true
            }
        });

        // Create a fast lookup map: spotId -> "start_end" strings
        const existingMap = new Set<string>();
        for (const b of existingBlocks) {
            existingMap.add(`${b.spotId}_${b.startDatetime.getTime()}_${b.endDatetime.getTime()}`);
        }

        const newBlocks = [];
        let skippedCount = 0;

        // Generate for the next 30 days
        for (let i = 1; i <= 30; i++) {
            const targetDate = addDays(today, i);

            // Slot 1: Day (08:00 - 19:00)
            const dayStart = setMilliseconds(setSeconds(setMinutes(setHours(targetDate, 8), 0), 0), 0);
            const dayEnd = setMilliseconds(setSeconds(setMinutes(setHours(targetDate, 19), 0), 0), 0);

            // Slot 2: Night (20:00 - 07:00 Next Day)
            const nightStart = setMilliseconds(setSeconds(setMinutes(setHours(targetDate, 20), 0), 0), 0);
            const nightEnd = addDays(setMilliseconds(setSeconds(setMinutes(setHours(targetDate, 7), 0), 0), 0), 1);

            const slots = [
                { start: dayStart, end: dayEnd, type: DurationType.ELEVEN_HOURS },
                { start: nightStart, end: nightEnd, type: DurationType.ELEVEN_HOURS }
            ];

            for (const spot of spots) {
                for (const slot of slots) {
                    const key = `${spot.id}_${slot.start.getTime()}_${slot.end.getTime()}`;

                    // Exact Match Check (Simplified for performance, assuming rigid grid)
                    // If we wanted robust overlap check, we'd need interval tree or filter, but grid is rigid.
                    if (existingMap.has(key)) {
                        skippedCount++;
                        continue;
                    }

                    // For more robust overlap (e.g. if partial block exists), we could check:
                    // But for MVP automated generation, we assume we own the grid. 
                    // Let's stick to exact match for 10x speedup.

                    newBlocks.push({
                        spotId: spot.id,
                        startDatetime: slot.start,
                        endDatetime: slot.end,
                        durationType: slot.type,
                        basePriceClp: 5000,
                        status: 'available' as const
                    });
                }
            }
        }

        // Batch Create
        if (newBlocks.length > 0) {
            await db.availabilityBlock.createMany({
                data: newBlocks
            });
        }

        logger.info(`[Availability Job] Completed. Created: ${newBlocks.length}, Skipped: ${skippedCount}`);
        return res.status(200).json({ success: true, created: newBlocks.length, skipped: skippedCount });

    } catch (error) {
        logger.error(error, '[Availability Job] Failed');
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
