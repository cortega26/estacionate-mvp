import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db } from '../../lib/db.js'

// Query Schema
const searchSchema = z.object({
    buildingId: z.string().uuid(),
    date: z.string().optional(), // ISO Date, defaults to today
    durationType: z.enum(['11h', '23h']).optional()
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    try {
        // Basic query parsing (req.query values are strings)
        const buildingId = req.query.buildingId as string
        const date = req.query.date as string
        const durationType = req.query.durationType as any

        const query = searchSchema.parse({
            buildingId,
            date,
            durationType
        })

        // Filter Logic
        const whereClause: any = {
            status: 'available',
            spot: {
                buildingId: query.buildingId
            }
        }

        if (query.date) {
            // Simple day filter: Start time >= Date 00:00 and End time <= Date 23:59? 
            // Or just "starts on this day".
            // For MVP availability blocks are usually fixed slots per day.
            const startOfDay = new Date(query.date)
            startOfDay.setHours(0, 0, 0, 0)

            const endOfDay = new Date(query.date)
            endOfDay.setHours(23, 59, 59, 999)

            whereClause.startDatetime = {
                gte: startOfDay,
                lte: endOfDay
            }
        }

        if (query.durationType) {
            whereClause.durationType = query.durationType
        }

        const blocks = await db.availabilityBlock.findMany({
            where: whereClause,
            include: {
                spot: true // Include spot number info
            },
            orderBy: {
                startDatetime: 'asc'
            }
        })

        return res.status(200).json({ success: true, data: blocks })

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
