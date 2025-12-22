import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { AuthenticatedRequest } from '../../types/express-shim.js'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'

import { verifyToken, getTokenFromRequest } from '../../services/auth.js'

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const token = getTokenFromRequest(req)
        if (!token) return res.status(401).json({ error: 'Unauthorized' })

        const user = verifyToken(token)
        if (!user || !user.role || !['admin', 'building_admin'].includes(user.role)) {
            return res.status(403).json({ error: 'Forbidden' })
        }

        let buildingId = req.query.buildingId as string;

        // Force building_admin to their own building
        if (user.role === 'building_admin') {
            if (!user.buildingId) {
                return res.status(403).json({ error: 'Building Admin has no assigned building' })
            }
            if (buildingId && buildingId !== user.buildingId) {
                return res.status(403).json({ error: 'Access denied to this building' })
            }
            buildingId = user.buildingId;
        }

        // Base Filter: Booking -> AvailabilityBlock -> Spot -> Building
        const whereBuilding = buildingId ? {
            availabilityBlock: {
                spot: {
                    buildingId: buildingId
                }
            }
        } : {};

        // 1. Total Revenue (Completed Bookings)
        const revenueAgg = await db.booking.aggregate({
            _sum: {
                amountClp: true
            },
            where: {
                ...whereBuilding,
                status: 'completed'
            }
        });

        // 2. Active Bookings vs Total (Pending or Confirmed)
        const activeBookingsCount = await db.booking.count({
            where: {
                ...whereBuilding,
                status: {
                    in: ['confirmed', 'pending']
                }
            }
        });

        // 3. Recent Activity
        const recentActivity = await db.booking.findMany({
            where: whereBuilding,
            take: 5,
            orderBy: {
                createdAt: 'desc'
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
            }
        });

        // 4. Total Spots (Capacity)
        const totalSpots = await db.visitorSpot.count({
            where: buildingId ? { buildingId } : {}
        });

        // 5. [Super Admin Only] Platform Revenue Calculation (Approximation)
        const platformRevenue = 0;
        if (user.role === 'admin' && !buildingId) {
            // Placeholder
        }

        // 6. Revenue Trend (Daily - Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const rawDailyRevenue = await db.booking.findMany({
            where: {
                ...whereBuilding,
                status: 'completed',
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                createdAt: true,
                amountClp: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Group by day YYYY-MM-DD
        const dailyMap = new Map<string, number>();
        // Initialize last 30 days with 0
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            const key = d.toISOString().split('T')[0];
            dailyMap.set(key, 0);
        }

        // Aggregate
        rawDailyRevenue.forEach(b => {
            const key = b.createdAt.toISOString().split('T')[0];
            if (dailyMap.has(key)) {
                dailyMap.set(key, (dailyMap.get(key) || 0) + b.amountClp);
            }
        });

        const revenueOverTime = Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount }));

        return res.status(200).json({
            success: true,
            data: {
                revenue: revenueAgg._sum.amountClp || 0,
                activeBookings: activeBookingsCount,
                totalSpots,
                occupancyRate: totalSpots > 0 ? ((activeBookingsCount / totalSpots) * 100).toFixed(1) : 0,
                revenueOverTime,
                recentActivity: recentActivity.map(b => ({
                    id: b.id,

                    status: b.status,
                    amountClp: b.amountClp,
                    createdAt: b.createdAt,
                    user: b.resident,
                    spot: { spotNumber: b.availabilityBlock.spot.spotNumber }
                }))
            }
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
