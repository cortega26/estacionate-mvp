import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import { verifyToken } from '../../lib/auth.js'

const createBookingSchema = z.object({
    blockId: z.string().uuid(),
    vehiclePlate: z.string().min(5),
    visitorName: z.string().min(3),
    visitorPhone: z.string().optional()
})

const AUTH_HEADER = 'authorization'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    // 1. Auth Check
    const token = req.headers[AUTH_HEADER]?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const user = verifyToken(token)
    if (!user) return res.status(401).json({ error: 'Invalid token' })

    // Only residents can create bookings for themselves
    if (user.role !== 'resident') {
        return res.status(403).json({ error: 'Only residents can make bookings' })
    }

    try {
        const data = createBookingSchema.parse(req.body)

        // 2. Optimistic Locking Transaction
        const booking = await db.$transaction(async (tx) => {
            // Atomic Update: Only succeeds if status is currently 'available'
            // Prisma `update` throws RecordNotFound if where clause doesn't match
            // But `updateMany` returns count. `update` is better for ID.
            // Wait, standard `update` requires a unique `where`. Compound `where`?
            // No, we can't do `where: { id: x, status: 'available' }` in `update` if `status` is not part of unique ID.
            // Workaround: `updateMany` (returns count) or `findFirst` with lock (Postgres SELECT FOR UPDATE).
            // Spec Plan said "Optimistic Locking".
            // Better approach in Prisma:
            // Try to updateMany where id=id AND status=available. If count == 0, fail.

            const result = await tx.availabilityBlock.updateMany({
                where: {
                    id: data.blockId,
                    status: 'available'
                },
                data: {
                    status: 'reserved'
                }
            })

            if (result.count === 0) {
                throw new Error('BLOCK_UNAVAILABLE')
            }

            // Fetch the block to get details for booking (price)
            const block = await tx.availabilityBlock.findUniqueOrThrow({
                where: { id: data.blockId }
            })

            // Create Booking
            return tx.booking.create({
                data: {
                    residentId: user.userId,
                    availabilityBlockId: data.blockId,
                    visitorName: data.visitorName,
                    visitorPhone: data.visitorPhone,
                    vehiclePlate: data.vehiclePlate,
                    amountClp: block.basePriceClp,
                    commissionClp: Math.floor(block.basePriceClp * 0.1), // 10% example
                    status: 'pending', // Pending Payment
                    confirmationCode: Math.random().toString(36).substring(7).toUpperCase(),
                    specialInstructions: 'Park carefully'
                }
            })
        })

        return res.status(201).json({ success: true, booking })

    } catch (error: any) {
        if (error.message === 'BLOCK_UNAVAILABLE') {
            return res.status(409).json({ error: 'Spot is no longer available' })
        }
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }
        if (error.code === 'P2003') {
            return res.status(400).json({ error: 'Invalid Resident ID' })
        }
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
