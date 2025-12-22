import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import { z } from 'zod'

const verifySchema = z.object({
    plate: z.string().optional(),
    code: z.string().optional()
}).refine(data => data.plate || data.code, {
    message: "Debe ingresar patente o código"
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const user = verifyToken(token)

    if (!user || user.role !== 'concierge') {
        return res.status(403).json({ error: 'Forbidden: Concierge only' })
    }
    if (!user.buildingId) {
        return res.status(403).json({ error: 'Concierge has no assigned building' })
    }

    try {
        const { plate, code } = verifySchema.parse(req.body);

        const now = new Date(); // Right now

        // Find a booking that matches plate or code, AND belongs to this building, AND is active/valid now
        const booking = await db.booking.findFirst({
            where: {
                ...(plate ? { vehiclePlate: { equals: plate, mode: 'insensitive' } } : {}),
                ...(code ? { confirmationCode: { equals: code, mode: 'insensitive' } } : {}),
                availabilityBlock: {
                    spot: {
                        buildingId: user.buildingId
                    },
                    // Verify overlap with NOW
                    // start <= now <= end
                    startDatetime: { lte: now },
                    endDatetime: { gte: now }
                },
                status: 'confirmed'
            },
            include: {
                resident: {
                    select: { firstName: true, lastName: true, email: true }
                },
                availabilityBlock: {
                    include: {
                        spot: { select: { spotNumber: true } }
                    }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: 'No active booking found for this vehicle.'
            });
        }

        return res.status(200).json({
            success: true,
            valid: true,
            data: {
                id: booking.id,
                plate: booking.vehiclePlate,
                visitorName: booking.visitorName,
                spotNumber: booking.availabilityBlock.spot.spotNumber,
                resident: `${booking.resident.firstName} ${booking.resident.lastName}`,
                expiresAt: booking.availabilityBlock.endDatetime
            }
        })

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
