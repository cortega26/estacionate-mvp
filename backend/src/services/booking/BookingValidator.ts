import { z } from 'zod';
import { db } from '../../lib/db.js';
import { AppError } from '../../lib/errors.js';
import { ServiceErrorCode } from '../../lib/error-codes.js';

const createBookingSchema = z.object({
    blockId: z.string().uuid(),
    vehiclePlate: z.string().min(5),
    visitorName: z.string().min(3),
    visitorPhone: z.string().optional()
});

export interface BookingUser {
    userId: string;
    role: string;
    buildingId?: string | null;
}

export class BookingValidator {
    /**
     * Validates structural integrity of the input data.
     */
    static parseCreatePayload(rawData: unknown) {
        return createBookingSchema.parse(rawData);
    }

    /**
     * Checks if the user or vehicle is blacklisted.
     */
    static async validateBlacklist(user: BookingUser, vehiclePlate: string) {
        const resident = await db.resident.findUnique({
            where: { id: user.userId },
            select: { email: true, rutHash: true, unit: { select: { buildingId: true } } }
        });

        if (!resident) throw AppError.unauthorized(ServiceErrorCode.RESIDENT_NOT_FOUND, 'Resident not found');

        const bans = await db.blocklist.findMany({
            where: {
                OR: [
                    { buildingId: null }, // Global
                    { buildingId: resident.unit.buildingId } // This Building
                ],
                AND: {
                    OR: [
                        { type: 'EMAIL', value: resident.email },
                        { type: 'RUT', value: resident.rutHash || '' },
                        { type: 'PLATE', value: vehiclePlate }
                    ]
                }
            }
        });

        if (bans.length > 0) {
            const reasons = bans.map((b) => b.reason).filter(Boolean).join(', ');
            throw AppError.forbidden(ServiceErrorCode.BOOKING_BLOCKED, 'Booking Blocked', reasons, { reasons });
        }
    }

    /**
     * Validates business rules regarding building access and timing.
     */
    static validateBusinessRules(user: BookingUser, spotBuildingId: string | null, startDatetime: Date) {
        // Fix 1: Temporal Safety (Prevent Booking Past)
        if (new Date(startDatetime) < new Date()) {
            throw AppError.badRequest(ServiceErrorCode.PAST_TIME, 'Cannot book past dates');
        }

        // Fix 2: IDOR Prevention
        // If user has a specific buildingId (e.g. resident restricted to one building), ensure it matches.
        if (user.buildingId && spotBuildingId !== user.buildingId) {
            throw AppError.forbidden(ServiceErrorCode.BUILDING_MISMATCH, 'You can only book spots in your own building');
        }
    }

    /**
     * Checks for double bookings within a transaction.
     */
    static async checkDoubleBooking(tx: any, blockId: string, spotId: string, start: Date, end: Date) {
        const overlap = await tx.availabilityBlock.findFirst({
            where: {
                spotId: spotId,
                id: { not: blockId },
                status: 'reserved',
                startDatetime: { lt: end },
                endDatetime: { gt: start }
            }
        });

        if (overlap) {
            throw AppError.conflict(ServiceErrorCode.DOUBLE_BOOKING_DETECTED, 'Double Booking Detected');
        }
    }
}
