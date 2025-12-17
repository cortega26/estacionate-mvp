import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { verifyToken, getTokenFromRequest } from '../../lib/auth.js'
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

        bookings.forEach(b => {
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
