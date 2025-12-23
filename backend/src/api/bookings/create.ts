import type { VercelResponse } from '@vercel/node'
import type { AuthenticatedRequest } from '../../types/express-shim.js'
import { z } from 'zod'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import cors from '../../lib/cors.js'
import { BookingService } from '../../services/BookingService.js'

const createBookingSchema = z.object({
    blockId: z.string().uuid(),
    vehiclePlate: z.string().min(5),
    visitorName: z.string().min(3),
    visitorPhone: z.string().optional()
})

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    // 1. Auth Check
    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const user = verifyToken(token)
    if (!user) return res.status(401).json({ error: 'Invalid token' })

    // Only residents can create bookings for themselves
    if (user.role !== 'RESIDENT') {
        return res.status(403).json({ error: 'Only residents can make bookings' })
    }

    try {
        const data = createBookingSchema.parse(req.body)

        const meta = {
            ip: (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'),
            userAgent: req.headers['user-agent'] || 'unknown',
            country: (req.headers['x-vercel-ip-country'] as string || 'unknown')
        };

        const bookingUser = {
            userId: user.userId,
            role: user.role!, // Asserted 'RESIDENT' above
            buildingId: user.buildingId
        };

        const booking = await BookingService.createBooking(bookingUser, data, meta);

        return res.status(201).json({ success: true, booking })

    } catch (error: any) {
        // Map Service Errors to HTTP Responses
        const err = error as Error & { code?: string, reasons?: string };

        switch (err.message) {
            case 'RESIDENT_NOT_FOUND':
                return res.status(401).json({ error: 'Resident not found' });
            case 'BOOKING_BLOCKED':
                return res.status(403).json({
                    error: 'Booking Blocked',
                    message: `You or this vehicle are on a blocklist. Reason: ${err.reasons || 'Security Policy'}`
                });
            case 'BLOCK_UNAVAILABLE':
                return res.status(409).json({ error: 'Spot is no longer available' });
            case 'DOUBLE_BOOKING_DETECTED':
                return res.status(409).json({ error: 'Double Booking Detected' });
            case 'PAST_TIME':
                return res.status(400).json({ error: 'Cannot book past dates' });
            case 'BUILDING_MISMATCH':
                return res.status(403).json({ error: 'You can only book spots in your own building' });
        }

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }
        if (err.code === 'P2003') {
            return res.status(400).json({ error: 'Invalid Resident ID' })
        }

        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
