import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { verifyToken, getTokenFromRequest } from '../../lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const user = verifyToken(token)

    // Concierge Only
    if (!user || user.role !== 'concierge') {
        return res.status(403).json({ error: 'Forbidden: Concierge only' })
    }
    if (!user.buildingId) {
        return res.status(403).json({ error: 'Concierge has no assigned building' })
    }

    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Get confirmed bookings for today
        // Active = (Start <= Now <= End) OR (Start >= Now and Start <= EndOfDay)
        // Basically anything relevant for Today.

        const bookings = await db.booking.findMany({
            where: {
                availabilityBlock: {
                    spot: {
                        buildingId: user.buildingId
                    },
                    // Overlaps with today
                    startDatetime: {
                        lte: endOfDay
                    },
                    endDatetime: {
                        gte: startOfDay
                    }
                },
                status: {
                    in: ['confirmed', 'completed'] // confirmed = upcoming/active, completed = historic but maybe still in lot? 
                    // Actually for gatekeeper, we probably care about 'confirmed'. 'completed' means they left? 
                    // Let's assume 'completed' means the SYSTEM marked it done, but maybe they are physically leaving.
                    // For now, let's show 'confirmed' (Active/Upcoming) and 'completed' (Recent History)
                }
            },
            orderBy: {
                availabilityBlock: {
                    startDatetime: 'asc'
                }
            },
            include: {
                resident: {
                    select: { firstName: true, email: true }
                },
                availabilityBlock: {
                    include: {
                        spot: {
                            select: { spotNumber: true }
                        }
                    }
                }
            },
            take: 50
        });

        const data = bookings.map(b => {
            const now = new Date();
            const start = new Date(b.availabilityBlock.startDatetime);
            const end = new Date(b.availabilityBlock.endDatetime);

            let state = 'upcoming';
            if (now >= start && now <= end) state = 'active';
            if (now > end) state = 'expired';

            return {
                id: b.id,
                plate: b.vehiclePlate,
                visitorName: b.visitorName,
                spotNumber: b.availabilityBlock.spot.spotNumber,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                state: state, // active, upcoming, expired
                status: b.status // confirmed, completed
            }
        });

        return res.status(200).json({ success: true, data });

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
