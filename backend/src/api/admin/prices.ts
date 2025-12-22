import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import cors from '../../lib/cors.js'
import { z } from 'zod'

const priceUpdateSchema = z.object({
    buildingId: z.string().uuid(),
    newPrice: z.number().min(0)
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

    // 1. Auth & Role Check
    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const user = verifyToken(token)
    if (!user) return res.status(401).json({ error: 'Invalid token' })

    if (!user || typeof user !== 'object' || !['admin', 'building_admin'].includes(user.role || '')) {
        return res.status(403).json({ error: 'Forbidden' })
    }

    try {
        const { buildingId, newPrice } = priceUpdateSchema.parse(req.body);

        // Security Check: Building Admin can only modify own building
        if (user.role === 'building_admin') {
            if (!user.buildingId) return res.status(403).json({ error: 'No building assigned' });
            if (buildingId !== user.buildingId) {
                return res.status(403).json({ error: 'Access denied to this building' });
            }
        }

        // Update all spots in this building to the new base price
        // In a real app, we might update 'AvailabilityBlocks' too, but for MVP we update the Spot definition
        // which implies future blocks generated will inherit this.
        // HOWEVER, our current Logic puts price on the BLOCK.
        // So we should also update FUTURE blocks that are 'available'.

        // 1. Update Spot Definition (Conceptually)
        // (Our schema holds price on AvailabilityBlock, not VisitorSpot directly, but let's assume we update unbooked blocks)

        const updateResult = await db.availabilityBlock.updateMany({
            where: {
                spot: {
                    buildingId: buildingId
                },
                status: 'available', // Only update available blocks
                startDatetime: {
                    gt: new Date() // Only future blocks
                }
            },
            data: {
                basePriceClp: newPrice
            }
        });

        return res.status(200).json({
            success: true,
            message: `Updated prices for ${updateResult.count} future availability blocks.`,
            updatedCount: updateResult.count
        })

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
