import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db, ActorType } from '../../lib/db.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import { calculateBookingPricing } from '../../lib/domain/pricing.js'
import cors from '../../lib/cors.js'
import crypto from 'crypto'
import { EventBus, EventType } from '../../lib/event-bus.js'

const createBookingSchema = z.object({
    blockId: z.string().uuid(),
    vehiclePlate: z.string().min(5),
    visitorName: z.string().min(3),
    visitorPhone: z.string().optional()
})

const AUTH_HEADER = 'authorization'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    // 1. Auth Check
    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const user = verifyToken(token)
    if (!user) return res.status(401).json({ error: 'Invalid token' })

    // Only residents can create bookings for themselves
    if (user.role !== 'resident') {
        return res.status(403).json({ error: 'Only residents can make bookings' })
    }

    try {
        const data = createBookingSchema.parse(req.body)

        // --- 0. BLACKLIST CHECK ---
        // Check if Resident is blocked (Email or RUT)
        // Check if Visitor Vehicle is blocked (Plate)
        // Scope: Global (null) OR This Building

        // We need resident details (RUT Hash/Email) to check. User object corresponds to Resident?
        // VerifyToken returns { userId, role, buildingId, unitId ... }
        // We probably need to fetch the resident to get the RutHash if it's not in the token.
        // Or we rely on Email (in token? maybe)

        // Let's fetch resident for robustness (also needed for logic)
        // Wait, we query DB anyway.

        const resident = await db.resident.findUnique({
            where: { id: user.userId },
            select: { email: true, rutHash: true, unit: { select: { buildingId: true } } }
        });

        if (!resident) return res.status(401).json({ error: 'Resident not found' });

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
            const reasons = bans.map((b: any) => b.reason).filter(Boolean).join(', ');
            return res.status(403).json({
                error: 'Booking Blocked',
                message: `You or this vehicle are on a blocklist. Reason: ${reasons || 'Security Policy'}`
            });
        }

        // 2. Optimistic Locking Transaction
        const booking = await db.$transaction(async (tx) => {
            // 0. PRE-FETCH: Get Spot ID to acquire lock
            const preBlock = await tx.availabilityBlock.findUniqueOrThrow({
                where: { id: data.blockId },
                select: { spotId: true }
            })

            // 1. LOCK PARENT RESOURCE (VisitorSpot)
            // Serializes booking attempts for this spot
            await tx.visitorSpot.update({
                where: { id: preBlock.spotId },
                data: { updatedAt: new Date() }
            })

            // Atomic Update: Only succeeds if status is currently 'available'
            // Prisma `update` throws RecordNotFound if where clause doesn't match
            // But `updateMany` returns count. `update` is better for ID.
            // Wait, standard `update` requires a unique `where`. Compound `where`?
            // No, we can't do `where: { id: x, status: 'available' }` in `update` if `status` is not part of unique ID.
            // Workaround: `updateMany` (returns count) or `findFirst` with lock (Postgres SELECT FOR UPDATE).
            // Spec Plan said "Optimistic Locking".
            // Better approach in Prisma:
            // Try to updateMany where id=id AND status=available. If count == 0, fail.

            const result = await tx.availabilityBlock.updateMany({
                where: {
                    id: data.blockId,
                    status: 'available'
                },
                data: {
                    status: 'reserved'
                }
            })

            if (result.count === 0) {
                throw new Error('BLOCK_UNAVAILABLE')
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
            })

            // Fix 1: Temporal Safety (Prevent Booking Past)
            if (new Date(block.startDatetime) < new Date()) {
                throw new Error('PAST_TIME')
            }

            // Fix 2: IDOR Prevention
            // Ensure the resident is booking a spot in THEIR OWN building
            if (user.buildingId && block.spot.buildingId !== user.buildingId) {
                throw new Error('BUILDING_MISMATCH')
            }


            // Fix 3: Double Booking Overlap Check
            // Check if ANY other block for this spot is effectively reserved/booked and overlaps this time
            // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
            // We search for: status != available AND spotId = block.spotId AND overlap
            const overlap = await tx.availabilityBlock.findFirst({
                where: {
                    spotId: block.spotId,
                    id: { not: block.id }, // Don't check self
                    status: 'reserved',
                    // Overlap Condition:
                    startDatetime: { lt: block.endDatetime },
                    endDatetime: { gt: block.startDatetime }
                }
            })

            if (overlap) {
                throw new Error('DOUBLE_BOOKING_DETECTED')
            }

            // --- YIELD MANAGEMENT ---
            // Fetch applicable pricing rules
            // Rules that are: Active, For this Building, and Overlap with Booking dates
            const rules = await tx.pricingRule.findMany({
                where: {
                    buildingId: block.spot.buildingId,
                    isActive: true,
                    startDate: { lte: block.endDatetime },
                    endDate: { gte: block.startDatetime }
                },
                orderBy: {
                    priority: 'desc' // Highest priority first
                }
            });

            // If overlap, pick the highest priority rule.
            // If multiple same priority, maybe pick highest multiplier?
            // For now, taking the first one (Highest Priority).
            let multiplier = 1.0;
            if (rules.length > 0) {
                multiplier = rules[0].multiplier;
                // Optional: Log which rule applied?
            }

            const pricing = calculateBookingPricing(
                block.basePriceClp,
                block.spot.building.platformCommissionRate,
                multiplier
            )


            // Create Booking
            const booking = await tx.booking.create({
                data: {
                    residentId: user.userId,
                    availabilityBlockId: data.blockId,
                    visitorName: data.visitorName,
                    visitorPhone: data.visitorPhone,
                    vehiclePlate: data.vehiclePlate,
                    amountClp: pricing.totalAmountClp,
                    commissionClp: pricing.commissionClp,
                    status: 'pending', // Pending Payment
                    confirmationCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
                    specialInstructions: 'Park carefully'
                }
            })

            return booking
        })

        // --- 3. POST-TRANSACTION EVENTS ---
        const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const country = req.headers['x-vercel-ip-country'] as string || 'unknown';

        EventBus.getInstance().publish({
            actorId: user.userId,
            actorType: ActorType.HUMAN,
            action: EventType.BOOKING_CREATED,
            entityId: booking.id,
            entityType: 'Booking',
            metadata: {
                paymentMethod: 'MercadoPago',
                amount: booking.amountClp,
                country
            },
            ipAddress: ip,
            userAgent
        });

        // Geo-Auditing: Flag non-CL bookings
        if (country !== 'unknown' && country !== 'CL') {
            EventBus.getInstance().publish({
                actorId: user.userId,
                actorType: ActorType.SYSTEM, // System flagged it
                action: EventType.SUSPICIOUS_ACTIVITY,
                entityId: booking.id,
                entityType: 'Booking',
                metadata: {
                    reason: 'Foreign IP Booking',
                    country,
                    riskLevel: 'MEDIUM'
                },
                ipAddress: ip,
                userAgent
            });
        }

        return res.status(201).json({ success: true, booking })

    } catch (error: any) {
        if (error.message === 'BLOCK_UNAVAILABLE') {
            return res.status(409).json({ error: 'Spot is no longer available' })
        }
        if (error.message === 'DOUBLE_BOOKING_DETECTED') {
            return res.status(409).json({ error: 'Double Booking Detected' })
        }
        if (error.message === 'PAST_TIME') {
            return res.status(400).json({ error: 'Cannot book past dates' })
        }
        if (error.message === 'BUILDING_MISMATCH') {
            return res.status(403).json({ error: 'You can only book spots in your own building' })
        }
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }
        if (error.code === 'P2003') {
            return res.status(400).json({ error: 'Invalid Resident ID' })
        }
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
