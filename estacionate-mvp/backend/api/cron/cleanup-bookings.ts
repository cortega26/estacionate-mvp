import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import { subMinutes } from 'date-fns'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Cron jobs can be GET or POST usually
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    // 15 minute timeout for pending reservations
    const cutOffTime = subMinutes(new Date(), 15)

    try {
        const result = await db.$transaction(async (tx) => {
            // Find expired pending bookings that are holding a spot
            const expiredBookings = await tx.booking.findMany({
                where: {
                    status: 'pending',
                    paymentStatus: 'pending',
                    createdAt: {
                        lt: cutOffTime
                    }
                },
                // Optimization: select only needed fields
                select: {
                    id: true,
                    availabilityBlockId: true
                }
            })

            if (expiredBookings.length === 0) return { count: 0 }

            const bookingIds = expiredBookings.map(b => b.id)
            const blockIds = expiredBookings.map(b => b.availabilityBlockId)

            // 1. Cancel Bookings
            await tx.booking.updateMany({
                where: { id: { in: bookingIds } },
                data: {
                    status: 'cancelled',
                    specialInstructions: 'Cancelled by system (timeout)'
                }
            })

            // 2. Release Spots
            await tx.availabilityBlock.updateMany({
                where: { id: { in: blockIds } },
                data: { status: 'available' }
            })

            return { count: expiredBookings.length }
        })

        if (result.count > 0) {
            console.log(`[CRON] Cleaned up ${result.count} zombie bookings.`)
        }

        return res.status(200).json({ success: true, expired: result.count })
    } catch (error) {
        console.error('Cleanup failed:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
