import { db, ActorType } from '../lib/db.js';
import { calculateBookingPricing } from '../lib/domain/pricing.js';
import crypto from 'crypto';
import { EventBus, EventType } from '../lib/event-bus.js';
import { logger } from '../lib/logger.js';
import { PaymentService } from './PaymentService.js';
import { AppError, ErrorCode } from '../lib/errors.js';
import { ServiceErrorCode } from '../lib/error-codes.js';
import { BookingValidator, BookingUser } from './booking/BookingValidator.js';
import type { BookingStatus, AccessEventType } from '@prisma/client';

export type BookingEvent =
    | 'payment_approved'
    | 'check_in'
    | 'check_out'
    | 'overstay'
    | 'no_show'
    | 'cancel'

const TERMINAL_STATES: BookingStatus[] = ['cancelled', 'checked_out', 'no_show']

const EVENT_TRANSITIONS: Record<BookingEvent, { from: BookingStatus[]; to: BookingStatus }> = {
    payment_approved: { from: ['pending'], to: 'confirmed' },
    check_in:         { from: ['confirmed'], to: 'checked_in' },
    check_out:        { from: ['checked_in', 'overstay'], to: 'checked_out' },
    overstay:         { from: ['checked_in'], to: 'overstay' },
    no_show:          { from: ['confirmed'], to: 'no_show' },
    cancel:           { from: ['pending', 'confirmed'], to: 'cancelled' },
}

const ACCESS_EVENT_TYPE: Partial<Record<BookingEvent, AccessEventType>> = {
    check_in:  'check_in',
    check_out: 'check_out',
    no_show:   'no_show_marked',
}




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
            await tx.availabilityBlock.findUniqueOrThrow({
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
            logger.error({
                err: paymentErr,
                bookingId: booking.id,
                residentId: user.userId,
                availabilityBlockId: data.blockId,
            }, 'Payment preference creation failed; attempting rollback');

            // Compensating Transaction: Cancel the booking if payment init fails
            // We use the system actor to cancel it immediately
            await BookingService.cancelBooking(booking.id, user.userId, 'system-rollback').catch(rollbackErr => {
                // If rollback fails, we have a true zombie. Log CRITICAL error.
                logger.error({
                    err: rollbackErr,
                    bookingId: booking.id,
                    residentId: user.userId,
                    availabilityBlockId: data.blockId,
                }, 'Critical rollback failure left a zombie booking');
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

    /**
     * Sole entry point for changing Booking.status.
     * Validates the transition, updates the booking, and creates an AccessEvent when applicable.
     */
    static async transition(
        bookingId: string,
        event: BookingEvent,
        actorId: string,
        context?: { plateObserved?: string; notes?: string }
    ) {
        const booking = await db.booking.findUnique({ where: { id: bookingId } })
        if (!booking) throw AppError.notFound(ServiceErrorCode.BOOKING_NOT_FOUND, 'Booking not found')

        if (TERMINAL_STATES.includes(booking.status)) {
            throw new AppError({
                code: ServiceErrorCode.CANNOT_CANCEL_COMPLETED_BOOKING,
                statusCode: 409,
                publicMessage: `Booking is already in terminal state: ${booking.status}`,
                internalMessage: `Booking ${bookingId} is in terminal state '${booking.status}'; rejected transition '${event}'`,
            })
        }

        const rule = EVENT_TRANSITIONS[event]
        if (!rule.from.includes(booking.status)) {
            throw new AppError({
                code: ServiceErrorCode.CANNOT_CANCEL_COMPLETED_BOOKING,
                statusCode: 409,
                publicMessage: `Invalid transition from '${booking.status}' via '${event}'`,
                internalMessage: `Invalid transition: current status '${booking.status}' not in allowed set ${JSON.stringify(rule.from)} for event '${event}'`,
            })
        }

        const accessEventType = ACCESS_EVENT_TYPE[event]

        const updated = await db.$transaction(async (tx) => {
            const result = await tx.booking.update({
                where: { id: bookingId },
                data: { status: rule.to },
            })

            if (accessEventType) {
                await tx.accessEvent.create({
                    data: {
                        bookingId,
                        actorId,
                        type: accessEventType,
                        plateObserved: context?.plateObserved ?? booking.vehiclePlate,
                        notes: context?.notes,
                    },
                })
            }

            return result
        })

        logger.info({
            bookingId,
            actorId,
            event,
            fromStatus: booking.status,
            toStatus: updated.status,
        }, '[BookingService] Transition applied')

        EventBus.getInstance().publish({
            actorId,
            actorType: ActorType.HUMAN,
            action: EventType.BOOKING_CANCELLED, // reuse nearest event type; extend EventType enum as needed
            entityId: bookingId,
            entityType: 'Booking',
            metadata: { event, fromStatus: booking.status, toStatus: updated.status },
            ipAddress: 'internal',
            userAgent: 'internal',
        })

        return updated
    }
}
