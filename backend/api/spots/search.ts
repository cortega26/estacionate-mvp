import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import { Prisma } from '@prisma/client'
import { fromZonedTime } from 'date-fns-tz'
import cors from '../../lib/cors.js'

// Query Schema
const searchSchema = z.object({
    buildingId: z.string().uuid(),
    date: z.string().optional(), // ISO Date, defaults to today
    durationType: z.enum(['11h', '23h']).optional()
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    try {
        // Basic query parsing (req.query values are strings)
        const buildingId = req.query.buildingId as string
        const date = req.query.date as string
        const durationType = req.query.durationType as string | undefined

        const query = searchSchema.parse({
            buildingId,
            date,
            durationType
        })

        // Filter Logic
        const whereClause: Prisma.AvailabilityBlockWhereInput = {
            status: 'available',
            spot: {
                buildingId: query.buildingId
            }
        }

        if (query.date) {
            // Fix: Use date-fns-tz for explicit timezone handling
            const timeZone = 'America/Santiago'

            // Parse the date string simply as a calendar date, then form the range in the specific timezone
            const [year, month, day] = query.date.split('-').map(Number)

            // Construct start of day in the target timezone
            // Note: Month in Date constructor is 0-indexed
            const startOfDay = fromZonedTime(new Date(year, month - 1, day, 0, 0, 0, 0), timeZone)

            // Construct end of day in the target timezone
            const endOfDay = fromZonedTime(new Date(year, month - 1, day, 23, 59, 59, 999), timeZone)

            whereClause.startDatetime = {
                gte: startOfDay,
                lte: endOfDay
            }
        }

        if (query.durationType) {
            // Map '11h' -> 'ELEVEN_HOURS' for Prisma
            const durationMap: Record<string, 'ELEVEN_HOURS' | 'TWENTY_THREE_HOURS'> = {
                '11h': 'ELEVEN_HOURS',
                '23h': 'TWENTY_THREE_HOURS'
            }
            whereClause.durationType = durationMap[query.durationType]
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

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
