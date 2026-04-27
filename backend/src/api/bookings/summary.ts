import type { VercelResponse } from '@vercel/node'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../../types/express-shim.js'
import cors from '../../lib/cors.js'
import { db } from '../../lib/db.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import { AppError, ErrorCode } from '../../lib/errors.js'
import { ServiceErrorCode } from '../../lib/error-codes.js'

const querySchema = z.object({
    bookingId: z.string().uuid()
})

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
    if (!token) throw AppError.unauthorized(ErrorCode.AUTH_NO_TOKEN, 'Missing token')

    const user = verifyToken(token)
    if (!user) throw AppError.unauthorized(ErrorCode.AUTH_INVALID_TOKEN, 'Invalid token')

    const { bookingId } = querySchema.parse(req.query)

    const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: {
            availabilityBlock: {
                include: {
                    spot: {
                        include: {
                            building: {
                                select: {
                                    name: true,
                                    address: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!booking) {
        throw AppError.notFound(ServiceErrorCode.BOOKING_NOT_FOUND, 'Booking not found')
    }

    const normalizedRole = String(user.role || '').toLowerCase()
    const isResident = normalizedRole === 'resident'
    const isPrivileged = ['admin', 'building_admin', 'support'].includes(normalizedRole)

    if (isResident && booking.residentId !== user.userId) {
        throw AppError.forbidden(ServiceErrorCode.UNAUTHORIZED_CANCELLATION, 'Unauthorized booking access')
    }

    if (!isResident && !isPrivileged) {
        throw AppError.forbidden(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Unauthorized booking access')
    }

    return res.status(200).json({
        success: true,
        data: {
            id: booking.id,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            visitorName: booking.visitorName,
            visitorPhone: booking.visitorPhone,
            vehiclePlate: booking.vehiclePlate,
            amountClp: booking.amountClp,
            confirmationCode: booking.confirmationCode,
            specialInstructions: booking.specialInstructions,
            startDatetime: booking.availabilityBlock.startDatetime,
            endDatetime: booking.availabilityBlock.endDatetime,
            spotNumber: booking.availabilityBlock.spot.spotNumber,
            buildingName: booking.availabilityBlock.spot.building.name,
            buildingAddress: booking.availabilityBlock.spot.building.address,
        }
    })
}