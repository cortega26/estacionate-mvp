import { db, ActorType } from '../lib/db.js';
import { calculateBookingPricing } from '../lib/domain/pricing.js';
import crypto from 'crypto';
import { z } from 'zod';
import { EventBus, EventType } from '../lib/event-bus.js';
import { logger } from '../lib/logger.js';
import { PaymentService } from './PaymentService.js';
import { AppError, ErrorCode } from '../lib/errors.js';
import { ServiceErrorCode } from '../lib/error-codes.js';
import { BookingValidator, BookingUser } from './booking/BookingValidator.js';




interface RequestMetadata {
    ip: string;
    userAgent: string;
    country: string;
}

export class BookingService {
    static async createBooking(user: BookingUser, rawData: unknown, meta: RequestMetadata) {
        // 1. Validation
        const data = BookingValidator.parseCreatePayload(rawData);

        // --- 0. BLACKLIST CHECK ---
        await BookingValidator.validateBlacklist(user, data.vehiclePlate);

        // 2. Optimistic Locking Transaction
        const booking = await db.$transaction(async (tx) => {
            // 0. PRE-FETCH: Get Spot ID to acquire lock
            const preBlock = await tx.availabilityBlock.findUniqueOrThrow({
                where: { id: data.blockId },
                select: { spotId: true }
            });

            // Atomic Update: Only succeeds if status is currently 'available'
            const result = await tx.availabilityBlock.updateMany({
                where: {
                    id: data.blockId,
                    status: 'available'
                },
                data: {
                    status: 'reserved'
                }
            });

            if (result.count === 0) {
                throw AppError.conflict(ServiceErrorCode.BLOCK_UNAVAILABLE, 'Spot is no longer available');
            }

            // Fetch the block to get details for booking (price)
            const block = await tx.availabilityBlock.findUniqueOrThrow({
                where: { id: data.blockId },
                include: {
                    spot: {
                        include: {
                            building: true
                        }
                    }
                }
            });

            // Check if Building is Active checks
            if ((block.spot.building as any).isActive === false) {
                throw AppError.conflict(ServiceErrorCode.BLOCK_UNAVAILABLE, 'Building is archived/inactive');
            }

            // Business Rules Validation
            BookingValidator.validateBusinessRules(user, block.spot.buildingId, block.startDatetime);

            // Check Double Booking
            await BookingValidator.checkDoubleBooking(tx, block.id, block.spotId, block.startDatetime, block.endDatetime);


            // --- YIELD MANAGEMENT ---
            const rules = await tx.pricingRule.findMany({
                where: {
                    buildingId: block.spot.buildingId,
                    isActive: true,
                    startDate: { lte: block.endDatetime },
                    endDate: { gte: block.startDatetime }
                },
                orderBy: {
                    priority: 'desc'
                }
            });

            let multiplier = 1.0;
            if (rules.length > 0) {
                multiplier = rules[0].multiplier;
            }

            const pricing = calculateBookingPricing(
                block.basePriceClp,
                block.spot.building.platformCommissionRate,
                multiplier
            );

            // Create Booking
            return tx.booking.create({
                data: {
                    residentId: user.userId,
                    availabilityBlockId: data.blockId,
                    visitorName: data.visitorName,
                    visitorPhone: data.visitorPhone,
                    vehiclePlate: data.vehiclePlate,
                    amountClp: pricing.totalAmountClp,
                    commissionClp: pricing.commissionClp,
                    status: 'pending',
                    confirmationCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
                    specialInstructions: 'Park carefully'
                }
            });
        });

        // --- 3. POST-TRANSACTION EVENTS ---
        EventBus.getInstance().publish({
            actorId: user.userId,
            actorType: ActorType.HUMAN,
            action: EventType.BOOKING_CREATED,
            entityId: booking.id,
            entityType: 'Booking',
            metadata: {
                paymentMethod: 'MercadoPago',
                amount: booking.amountClp,
                country: meta.country
            },
            ipAddress: meta.ip,
            userAgent: meta.userAgent
        });

        // Geo-Auditing
        if (meta.country !== 'unknown' && meta.country !== 'CL') {
            EventBus.getInstance().publish({
                actorId: user.userId,
                actorType: ActorType.SYSTEM,
                action: EventType.SUSPICIOUS_ACTIVITY,
                entityId: booking.id,
                entityType: 'Booking',
                metadata: {
                    reason: 'Foreign IP Booking',
                    country: meta.country,
                    riskLevel: 'MEDIUM'
                },
                ipAddress: meta.ip,
                userAgent: meta.userAgent
            });
        }

        // 4. Atomic Payment Initialization & Rollback
        try {
            const paymentPreference = await PaymentService.createPreference(booking.id);
            return { booking, payment: paymentPreference };
        } catch (paymentErr) {
            // Compensating Transaction: Cancel the booking if payment init fails
            // We use the system actor to cancel it immediately
            await BookingService.cancelBooking(booking.id, user.userId, 'system-rollback').catch(rollbackErr => {
                // If rollback fails, we have a true zombie. Log CRITICAL error.
                console.error('CRITICAL: ZOMBIE BOOKING CREATED', { bookingId: booking.id, error: rollbackErr });
            });

            throw new AppError({
                code: ErrorCode.PAYMENT_GATEWAY_ERROR,
                statusCode: 502, // Bad Gateway
                publicMessage: 'Booking created but payment gateway failed. Please try again.',
                originalError: paymentErr
            });
        }
    }
    static async cancelBooking(bookingId: string, actorId: string, role: string) {
        // 1. Fetch Booking
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { availabilityBlock: true }
        });

        if (!booking) throw AppError.notFound(ServiceErrorCode.BOOKING_NOT_FOUND, 'Booking not found');

        // 2. Authorization Check
        const isOwner = booking.residentId === actorId;
        const isAdmin = role === 'admin' || role === 'building_admin' || role === 'support'; // Simplified Role Check

        if (!isOwner && !isAdmin) {
            throw AppError.forbidden(ServiceErrorCode.UNAUTHORIZED_CANCELLATION, 'Unauthorized cancellation');
        }

        // 3. State Invariants
        if (booking.status === 'cancelled') {
            return booking; // Idempotent success
        }
        if (booking.status === 'completed' || booking.status === 'no_show') {
            throw AppError.badRequest(ServiceErrorCode.CANNOT_CANCEL_COMPLETED_BOOKING, 'Cannot cancel completed booking');
        }

        // 4. Calculate Refund
        const now = new Date(); // Server time (UTC usually, but let's assume standard Date obj)
        const start = new Date(booking.availabilityBlock.startDatetime);
        const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

        let refundAmount = 0;
        let refundReason = 'Policy: Late Cancellation';

        if (booking.paymentStatus === 'paid') {
            if (isAdmin) {
                // Concierge/Admin Override: 100% Refund
                refundAmount = booking.amountClp;
                refundReason = 'Admin Override';
            } else if (hoursUntilStart > 24) {
                // Policy: >24h = 90% Refund
                refundAmount = Math.floor(booking.amountClp * 0.90);
                refundReason = 'Policy: >24h Cancellation';
            } else {
                // Policy: <=24h = 0% Refund
                refundAmount = 0;
                refundReason = 'Policy: Late Cancellation';
            }
        }

        // 5. Execute Cancellation Transaction
        // We separate Refund call from DB transaction because External API (MP) might fail or take time.
        // But for consistency, we should ensure DB reflects the intent.

        // Step 5a: Release Spot & Update Booking Logic
        await db.$transaction(async (tx) => {
            await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'cancelled',
                    paymentStatus: refundAmount > 0 ? 'refunded' : booking.paymentStatus, // If 0 refund, keep 'paid' to show money was taken? Or 'cancelled'? Policy said 'paid' for 0% refund.
                    // Table says: Cancel (<=24h) -> New Payment Status: paid.
                    // Cancel (>24h) -> New Payment Status: refunded.
                }
            });

            await tx.availabilityBlock.update({
                where: { id: booking.availabilityBlockId },
                data: { status: 'available' }
            });
        });

        // Step 5b: Execute Money Refund (if applicable)
        if (refundAmount > 0) {
            try {
                await PaymentService.refundPayment(bookingId, refundAmount);
            } catch (err) {
                logger.error({ err, bookingId }, 'Refund Execution Failed - Manual Intervention Required');
                // We do NOT rollback the cancellation (Policy: "Spot released immediately"). 
                // We rely on Audit Log or Error Log to fix the money.
            }
        }

        // 6. Audit Logging
        EventBus.getInstance().publish({
            actorId: actorId,
            actorType: ActorType.HUMAN,
            action: EventType.BOOKING_CANCELLED,
            entityId: bookingId,
            entityType: 'Booking',
            metadata: {
                refundAmount,
                refundReason,
                timeRemainingHours: hoursUntilStart.toFixed(2)
            },
            ipAddress: 'internal', // passed from ctx if available
            userAgent: 'internal'
        });

        return { success: true, refundAmount };
    }
}
