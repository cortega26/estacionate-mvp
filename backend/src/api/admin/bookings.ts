import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import { Prisma } from '@prisma/client'
import { logger } from '../../lib/logger.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    let requester: ReturnType<typeof verifyToken> | null = null

    try {
        const token = getTokenFromRequest(req)
        if (!token) return res.status(401).json({ error: 'Unauthorized' })

        requester = verifyToken(token)
        if (!requester || (requester.role !== 'admin' && requester.role !== 'building_admin' && requester.role !== 'support')) {
            return res.status(403).json({ error: 'Forbidden' })
        }

        const page = parseInt(req.query.page as string) || 1
        const limit = 20
        const statusParam = req.query.status as string
        const statusList = statusParam ? statusParam.split(',') : []
        const search = req.query.search as string
        const buildingId = req.query.buildingId as string

        const whereClause: Prisma.BookingWhereInput = {
            ...(statusList.length > 0 ? { status: { in: statusList as any[] } } : {}),
            ...(buildingId ? { availabilityBlock: { spot: { buildingId } } } : {}),
            ...(search ? {
                OR: [
                    { visitorName: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { vehiclePlate: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { confirmationCode: { contains: search, mode: Prisma.QueryMode.insensitive } }
                ]
            } : {})
        }

        // Building Admin Restriction
        if (requester.role === 'building_admin') {
            if (!requester.buildingId) {
                return res.status(403).json({ error: 'Building Admin has no assigned building' })
            }
            if (buildingId && buildingId !== requester.buildingId) {
                logger.warn({
                    actorId: requester.userId,
                    role: requester.role,
                    tokenBuildingId: requester.buildingId,
                    requestedBuildingId: buildingId,
                }, '[AdminBookings] Cross-building access attempt blocked')
                return res.status(403).json({ error: 'Access denied to this building' })
            }
            whereClause.availabilityBlock = {
                spot: { buildingId: requester.buildingId }
            }
        }

        const [bookings, total] = await Promise.all([
            db.booking.findMany({
                where: whereClause,
                take: limit,
                skip: (page - 1) * limit,
                include: {
                    availabilityBlock: {
                        include: {
                            spot: {
                                select: {
                                    spotNumber: true,
                                    building: { select: { name: true } }
                                }
                            }
                        }
                    },
                    resident: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            unit: { select: { unitNumber: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            db.booking.count({ where: whereClause })
        ]);

        // Transform for UI
        const data = bookings.map(b => ({
            id: b.id,
            visitorName: b.visitorName,
            visitorPhone: b.visitorPhone,
            vehiclePlate: b.vehiclePlate,
            status: b.status,
            paymentStatus: b.paymentStatus,
            amount: b.amountClp,
            startDatetime: b.availabilityBlock.startDatetime,
            endDatetime: b.availabilityBlock.endDatetime,
            spotNumber: b.availabilityBlock.spot.spotNumber,
            buildingName: b.availabilityBlock.spot.building.name,
            residentName: b.resident ? `${b.resident.firstName} ${b.resident.lastName}` : 'N/A',
            residentUnit: b.resident?.unit?.unitNumber || 'N/A',
            confirmationCode: b.confirmationCode,
            specialInstructions: b.specialInstructions,
            createdAt: b.createdAt
        }));

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error: unknown) {
        logger.error({
            route: 'admin.bookings',
            method: req.method,
            actorRole: requester?.role,
            actorId: requester?.userId,
            requestedBuildingId: req.query?.buildingId,
            statusFilter: req.query?.status,
            error,
        }, '[Admin] List bookings error')
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
