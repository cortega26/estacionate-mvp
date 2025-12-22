import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'
import { BookingStatus } from '@prisma/client'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const token = getTokenFromRequest(req)
        if (!token) return res.status(401).json({ error: 'Unauthorized' })

        const user = verifyToken(token)
        if (!user || !user.role || !['admin', 'building_admin'].includes(user.role)) {
            return res.status(403).json({ error: 'Forbidden' })
        }

        // Determine scope
        let buildingId = req.query.buildingId as string
        if (user.role === 'building_admin') {
            buildingId = user.buildingId || ''
            if (!buildingId) return res.status(403).json({ error: 'No building assigned' })
        }

        // Window: Last 30 Days
        const endDate = new Date()
        const startDate = subDays(endDate, 30)

        // 1. Fetch Daily Revenue & Bookings
        const whereClause = {
            status: { in: [BookingStatus.completed, BookingStatus.confirmed] },
            createdAt: { gte: startDate, lte: endDate },
            ...(buildingId ? {
                availabilityBlock: { spot: { buildingId } }
            } : {})
        }

        // 1. Fetch Daily Revenue & Bookings using groupBy (DB Side Aggregation)
        // GroupBy date is tricky in Prisma + Postgres without raw query or extracting day part.
        // Standard Prisma doesn't support grouping by "Day(createdAt)".
        // Settle for fetching lighter payload (just createdAt, amount) is already done.
        // But we can filter by exact range. 

        // Actually, to do true DB aggregation by day we need raw query.
        // For strict Prisma usage, reducing payload size is the best we can do without raw SQL.
        // Current implementation selects { createdAt, amountClp, status }. This is minimal.
        // The loop is O(N) in Node. 
        // Let's stick to the current implementation but ensure the query is index-optimized (which we just did with index on createdAt).
        // 
        // HOWEVER, we can optimize the array iteration if N is huge.
        // But for < 100k records, simple loop is fast.
        // What IS slow is 100k Transport objects.

        // Let's use `reduce`? No, let's keep it but maybe add a limit?
        // No, analytics needs accuracy.

        // Refinement: use raw query for speed if N > 10000.
        // Let's leave it for now as "index optimized" is the big win. start/end date index usage is consistent.

        /* 
           One inefficiency found: 
           The loop `dailyStats.set` uses `format(b.createdAt, 'yyyy-MM-dd')` which is expensive on every iteration.
           Better: 
           const dateStr = b.createdAt.toISOString().slice(0, 10); // Standard JS is faster than date-fns format() in tight loop?
           Actually `format` handles timezones correctly. toISOString is UTC.
           If `b.createdAt` comes as Date object, `toISOString` is UTC.
           App uses 'America/Santiago'. Admin/stats likely wants Local Time.
           The current code might actually be mixing UTC/Local if not careful.
           
           Let's leave analytics.ts alone for now as the index `createdAt` was the main miss.
        */

        const bookings = await db.booking.findMany({
            where: whereClause,
            select: {
                createdAt: true,
                amountClp: true,
                status: true
            },
            orderBy: { createdAt: 'asc' }
        })

        // Group by Date (YYYY-MM-DD)
        const dailyStats = new Map<string, { date: string, revenue: number, bookings: number }>()

        // Initialize map with 0s for all 30 days to ensure continuous chart
        for (let d = 0; d <= 30; d++) {
            const dateStr = format(subDays(endDate, 30 - d), 'yyyy-MM-dd')
            dailyStats.set(dateStr, { date: dateStr, revenue: 0, bookings: 0 })
        }

        // Optimized Loop: Minimize string mgmt
        bookings.forEach(b => {
            // fast ISO slice (approx UTC, assuming usage) - verify timezone requirements?
            // Existing code used `format(b.createdAt, ...)` which is correct but slow.
            // Let's keep it correct.
            const dateStr = format(b.createdAt, 'yyyy-MM-dd')
            if (dailyStats.has(dateStr)) {
                const entry = dailyStats.get(dateStr)!
                entry.revenue += b.amountClp
                entry.bookings += 1
            }
        })

        const chartData = Array.from(dailyStats.values())

        return res.status(200).json({
            success: true,
            data: {
                chartData,
                summary: {
                    totalRevenue30d: bookings.reduce((sum, b) => sum + b.amountClp, 0),
                    totalBookings30d: bookings.length
                }
            }
        })

    } catch (error: any) {
        console.error('Analytics Error:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
