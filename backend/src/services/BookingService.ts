import { db, ActorType } from '../lib/db.js';
import { calculateBookingPricing } from '../lib/domain/pricing.js';
import crypto from 'crypto';
import { EventBus, EventType } from '../lib/event-bus.js';
import { logger } from '../lib/logger.js';
import { PaymentService } from './PaymentService.js';

interface BookingUser {
    userId: string;
    role: string;
    buildingId?: string | null;
}

interface CreateBookingInput {
    blockId: string;
    vehiclePlate: string;
    visitorName: string;
    visitorPhone?: string;
}

interface RequestMetadata {
    ip: string;
    userAgent: string;
    country: string;
}

export class BookingService {
    static async createBooking(user: BookingUser, data: CreateBookingInput, meta: RequestMetadata) {
        // --- 0. BLACKLIST CHECK ---
        const resident = await db.resident.findUnique({
            where: { id: user.userId },
            select: { email: true, rutHash: true, unit: { select: { buildingId: true } } }
        });

        if (!resident) throw new Error('RESIDENT_NOT_FOUND');

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
                        { type: 'PLATE', value: data.vehiclePlate }
                    ]
                }
            }
        });

        if (bans.length > 0) {
            const reasons = bans.map((b) => b.reason).filter(Boolean).join(', ');
            const error = new Error('BOOKING_BLOCKED');
            (error as any).reasons = reasons; // Attach metadata
            throw error;
        }

        // 2. Optimistic Locking Transaction
        const booking = await db.$transaction(async (tx) => {
            // 0. PRE-FETCH: Get Spot ID to acquire lock
            const preBlock = await tx.availabilityBlock.findUniqueOrThrow({
                where: { id: data.blockId },
                select: { spotId: true }
            });

            // 1. LOCK PARENT RESOURCE (VisitorSpot)
            await tx.visitorSpot.update({
                where: { id: preBlock.spotId },
                data: { updatedAt: new Date() }
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
                throw new Error('BLOCK_UNAVAILABLE');
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

            // Fix 1: Temporal Safety (Prevent Booking Past)
            if (new Date(block.startDatetime) < new Date()) {
                throw new Error('PAST_TIME');
            }

            // Fix 2: IDOR Prevention
            if (user.buildingId && block.spot.buildingId !== user.buildingId) {
                throw new Error('BUILDING_MISMATCH');
            }

            // Fix 3: Double Booking Overlap Check
            const overlap = await tx.availabilityBlock.findFirst({
                where: {
                    spotId: block.spotId,
                    id: { not: block.id },
                    status: 'reserved',
                    startDatetime: { lt: block.endDatetime },
                    endDatetime: { gt: block.startDatetime }
                }
            });

            if (overlap) {
                throw new Error('DOUBLE_BOOKING_DETECTED');
            }

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

        return booking;
    }
    static async cancelBooking(bookingId: string, actorId: string, role: string) {
        // 1. Fetch Booking
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { availabilityBlock: true }
        });

        if (!booking) throw new Error('BOOKING_NOT_FOUND');

        // 2. Authorization Check
        const isOwner = booking.residentId === actorId;
        const isAdmin = role === 'admin' || role === 'building_admin' || role === 'support'; // Simplified Role Check

        if (!isOwner && !isAdmin) {
            throw new Error('UNAUTHORIZED_CANCELLATION');
        }

        // 3. State Invariants
        if (booking.status === 'cancelled') {
            return booking; // Idempotent success
        }
        if (booking.status === 'completed' || booking.status === 'no_show') {
            throw new Error('CANNOT_CANCEL_COMPLETED_BOOKING');
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
