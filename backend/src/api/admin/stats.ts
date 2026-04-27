import type { VercelResponse } from '@vercel/node'
import type { AuthenticatedRequest } from '../../types/express-shim.js'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import { AppError, ErrorCode } from '../../lib/errors.js'
import { logger } from '../../lib/logger.js'

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    await cors(req, res)

    if (req.method !== 'GET') {
        throw new AppError({
            code: ErrorCode.SYSTEM_METHOD_NOT_ALLOWED,
            statusCode: 405,
            publicMessage: 'Method not allowed'
        })
    }

    const token = getTokenFromRequest(req)
    if (!token) {
        throw AppError.unauthorized(ErrorCode.AUTH_NO_TOKEN, 'Unauthorized')
    }

    const user = verifyToken(token)
    if (!user || !user.role || !['admin', 'building_admin', 'support'].includes(user.role)) {
        throw AppError.forbidden(ErrorCode.AUTH_INVALID_TOKEN, 'Forbidden', 'Admin stats access denied', {
            role: user?.role,
            requestedBuildingId: req.query.buildingId,
        })
    }

    let buildingId = req.query.buildingId as string | undefined

    if (user.role === 'building_admin') {
        if (!user.buildingId) {
            throw AppError.forbidden(
                ErrorCode.AUTH_INVALID_TOKEN,
                'Building Admin has no assigned building',
                'Building admin missing buildingId',
                {
                    role: user.role,
                    requestedBuildingId: buildingId,
                }
            )
        }

        if (buildingId && buildingId !== user.buildingId) {
            throw AppError.forbidden(
                ErrorCode.AUTH_INVALID_TOKEN,
                'Access denied to this building',
                'Building admin attempted cross-building stats access',
                {
                    role: user.role,
                    requestedBuildingId: buildingId,
                    effectiveBuildingId: user.buildingId,
                }
            )
        }

        buildingId = user.buildingId
    }

    const whereBuilding = buildingId
        ? {
            availabilityBlock: {
                spot: {
                    buildingId,
                },
            },
        }
        : {}

    const revenueAgg = await db.booking.aggregate({
        _sum: {
            amountClp: true,
        },
        where: {
            ...whereBuilding,
            status: 'completed',
        },
    })

    const activeBookingsCount = await db.booking.count({
        where: {
            ...whereBuilding,
            status: {
                in: ['confirmed', 'pending'],
            },
        },
    })

    const recentActivity = await db.booking.findMany({
        where: whereBuilding,
        take: 5,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            resident: {
                select: { firstName: true, email: true },
            },
            availabilityBlock: {
                include: {
                    spot: {
                        select: { spotNumber: true },
                    },
                },
            },
        },
    })

    const totalSpots = await db.visitorSpot.count({
        where: buildingId ? { buildingId } : {},
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const rawDailyRevenue = await db.booking.findMany({
        where: {
            ...whereBuilding,
            status: 'completed',
            createdAt: {
                gte: thirtyDaysAgo,
            },
        },
        select: {
            createdAt: true,
            amountClp: true,
        },
        orderBy: {
            createdAt: 'asc',
        },
    })

    const dailyMap = new Map<string, number>()
    for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        const key = date.toISOString().split('T')[0]
        dailyMap.set(key, 0)
    }

    rawDailyRevenue.forEach((booking) => {
        const key = booking.createdAt.toISOString().split('T')[0]
        if (dailyMap.has(key)) {
            dailyMap.set(key, (dailyMap.get(key) || 0) + booking.amountClp)
        }
    })

    const revenueOverTime = Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount }))

    logger.info({
        actorId: user.userId,
        role: user.role,
        buildingId: buildingId || 'all',
        activeBookings: activeBookingsCount,
        totalSpots,
    }, '[AdminStats] Dashboard stats generated')

    return res.status(200).json({
        success: true,
        data: {
            revenue: revenueAgg._sum.amountClp || 0,
            activeBookings: activeBookingsCount,
            totalSpots,
            occupancyRate: totalSpots > 0 ? ((activeBookingsCount / totalSpots) * 100).toFixed(1) : 0,
            revenueOverTime,
            recentActivity: recentActivity.map((booking) => ({
                id: booking.id,
                status: booking.status,
                amountClp: booking.amountClp,
                createdAt: booking.createdAt,
                user: booking.resident,
                spot: { spotNumber: booking.availabilityBlock.spot.spotNumber }
            }))
        }
    })
}
