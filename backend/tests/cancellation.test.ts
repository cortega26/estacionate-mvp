import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';

// Mock Redis to prevent connection errors during tests
vi.mock('../src/lib/redis.js', () => ({
    redis: {
        status: 'ready',
        incr: vi.fn().mockResolvedValue(1),
        expire: vi.fn().mockResolvedValue(1),
        on: vi.fn(),
    }
}));
// Wait, relying on "mock" behavior might be hard if we need specific UserIDs.
// Better: Fix the import path. Mocking is a workaround that might hide logic errors.
// BUT "Cannot find module" is environmental.
// Let's try to strictly fixing the import in `cancel.ts` to `../../services/auth` (no js) first. 
// If that works, good.
// The "Cannot find module" might be because I use `.js` and `vitest` doesn't find `auth.js` file (it's `auth.ts`).
// Vitest with `vite-node` usually maps requests for `.js` to `.ts`.
// But explicitly: try removing `.js`.

import { app } from '../app.js';
import { db } from '../src/lib/db.js';
import { signToken } from '../src/services/auth.js';
import { v4 as uuidv4 } from 'uuid';

describe('Booking Cancellation & Refunds', () => {
    let userToken: string;
    let adminToken: string;
    let userId: string;
    let buildingId: string;
    let blockIdFuture: string; // > 24h
    let blockIdSoon: string;   // < 24h

    let spotId: string;

    beforeAll(async () => {
        // Setup Building & Resident
        const building = await db.building.create({
            data: {
                name: 'Test Building ' + uuidv4(),
                address: '123 Test St',
                contactEmail: 'test@example.com',
                totalUnits: 10,
                salesRepCommissionRate: 0.05
            }
        });
        buildingId = building.id;

        // Create Spot
        const spot = await db.visitorSpot.create({
            data: {
                buildingId,
                spotNumber: 'V-TEST'
            }
        });
        spotId = spot.id;

        // Correct Resident Creation
        const unit = await db.unit.create({
            data: {
                buildingId,
                unitNumber: '101'
            }
        });

        const resident = await db.resident.create({
            data: {
                email: `res-${uuidv4()}@test.com`,
                rut: '12345678-9',
                rutHash: 'hash-12345678-9',
                firstName: 'John',
                lastName: 'Doe',
                unitId: unit.id,
                passwordHash: 'hash',
                isVerified: true
            }
        });
        userId = resident.id;

        const admin = await db.user.create({
            data: {
                email: `admin-${uuidv4()}@example.com`,
                passwordHash: 'hash',
                role: 'admin'
            }
        });

        // Tokens
        userToken = signToken({ userId: resident.id, role: 'resident', buildingId });
        adminToken = signToken({ userId: admin.id, role: 'admin' });

        // Create Availability Blocks
        // 1. Future Block (> 48h from now)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);

        const block1 = await db.availabilityBlock.create({
            data: {
                spotId, // correctly linked to spot
                startDatetime: futureDate,
                endDatetime: new Date(futureDate.getTime() + 11 * 60 * 60 * 1000), // 11h
                durationType: 'ELEVEN_HOURS', // Enum value
                basePriceClp: 10000,
                status: 'available'
            }
        });
        blockIdFuture = block1.id;

        // 2. Soon Block (< 24h from now)
        const soonDate = new Date();
        soonDate.setHours(soonDate.getHours() + 12); // 12h from now

        const block2 = await db.availabilityBlock.create({
            data: {
                spotId,
                startDatetime: soonDate,
                endDatetime: new Date(soonDate.getTime() + 4 * 60 * 60 * 1000),
                durationType: 'ELEVEN_HOURS', // reused
                basePriceClp: 5000,
                status: 'available'
            }
        });
        blockIdSoon = block2.id;
    });

    afterAll(async () => {
        // Cleanup
        // Note: deleteMany inputs must match where inputs.
        // Payment -> bookingId -> residentId lookup is via relation, not direct field on Payment?
        // Payment has bookingId. Booking has residentId.
        // We can't deleteMany Payment where booking.residentId = ... directly in simple deleteMany sometimes?
        // Actually Prisma supports relation filters.
        try {
            await db.payment.deleteMany({ where: { booking: { residentId: userId } } });
            await db.booking.deleteMany({ where: { residentId: userId } });
            // AvailabilityBlock doesn't have buildingId directly. access via spot.
            await db.availabilityBlock.deleteMany({ where: { spot: { buildingId } } });
            await db.visitorSpot.deleteMany({ where: { buildingId } })
            await db.resident.deleteMany({ where: { id: userId } });
            // Unit?
            // Building?
        } catch (e) { console.log('Cleanup error', e); }
    });

    it('should allow user to cancel >24h booking with 90% refund', async () => {
        // 1. Create Booking
        const booking = await db.booking.create({
            data: {
                residentId: userId,
                availabilityBlockId: blockIdFuture,
                status: 'confirmed',
                paymentStatus: 'paid',
                amountClp: 10000,
                commissionClp: 1000,
                vehiclePlate: 'HK-99-99',
                visitorName: 'Test Visitor',
                confirmationCode: 'CONF-' + uuidv4().substring(0, 5)
            }
        });

        // 2. Create Payment Record (required for refund logic)
        await db.payment.create({
            data: {
                bookingId: booking.id,
                amountClp: 10000,
                status: 'approved',
                externalPaymentId: 'mock-payment-id',
                gatewayResponse: { simulator: true, id: 'mock-payment-id' }
            }
        });

        // 3. Cancel
        const res = await request(app)
            .post('/api/bookings/cancel')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ bookingId: booking.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.refundAmount).toBe(9000); // 90% of 10000

        // 4. Verify DB State
        const updatedBooking = await db.booking.findUnique({ where: { id: booking.id } });
        expect(updatedBooking?.status).toBe('cancelled');
        expect(updatedBooking?.paymentStatus).toBe('refunded');

        const block = await db.availabilityBlock.findUnique({ where: { id: blockIdFuture } });
        expect(block?.status).toBe('available');
    });

    it('should allow user to cancel <24h booking with 0% refund', async () => {
        // 1. Create Booking
        const booking = await db.booking.create({
            data: {
                residentId: userId,
                availabilityBlockId: blockIdSoon,
                status: 'confirmed',
                paymentStatus: 'paid',
                amountClp: 5000,
                commissionClp: 500,
                vehiclePlate: 'HK-88-88',
                visitorName: 'Test Visitor',
                confirmationCode: 'CONF-' + uuidv4().substring(0, 5)
            }
        });

        // 2. Create Payment Record
        await db.payment.create({
            data: {
                bookingId: booking.id,
                amountClp: 5000,
                status: 'approved',
                externalPaymentId: 'mock-payment-soon',
                gatewayResponse: { simulator: true, id: 'mock-payment-soon' }
            }
        });

        // 3. Cancel
        const res = await request(app)
            .post('/api/bookings/cancel')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ bookingId: booking.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.refundAmount).toBe(0);

        // 4. Verify DB State
        const updatedBooking = await db.booking.findUnique({ where: { id: booking.id } });
        expect(updatedBooking?.status).toBe('cancelled');
        expect(updatedBooking?.paymentStatus).toBe('paid'); // Kept as paid per logic comment (or refunded if 0 logic changed?) 
        // Logic was: paymentStatus: refundAmount > 0 ? 'refunded' : booking.paymentStatus

        const block = await db.availabilityBlock.findUnique({ where: { id: blockIdSoon } });
        expect(block?.status).toBe('available');
    });

    it('should allow Admin to cancel <24h booking with 100% refund (Override)', async () => {
        // Reuse blockIdSoon but need to re-book it first since previous test freed it.
        // Actually, previous test freed it, so we can book it again!

        // 1. Create Booking
        const booking = await db.booking.create({
            data: {
                residentId: userId,
                availabilityBlockId: blockIdSoon,
                status: 'confirmed',
                paymentStatus: 'paid',
                amountClp: 5000,
                commissionClp: 500,
                vehiclePlate: 'HK-77-77',
                visitorName: 'Test Visitor',
                confirmationCode: 'CONF-' + uuidv4().substring(0, 5)
            }
        });

        // 2. Create Payment Record
        await db.payment.create({
            data: {
                bookingId: booking.id,
                amountClp: 5000,
                status: 'approved',
                externalPaymentId: 'mock-payment-admin',
                gatewayResponse: { simulator: true, id: 'mock-payment-admin' }
            }
        });

        // 3. Cancel AS ADMIN
        const res = await request(app)
            .post('/api/bookings/cancel')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ bookingId: booking.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.refundAmount).toBe(5000); // 100% override

        // 4. Verify DB State
        const updatedBooking = await db.booking.findUnique({ where: { id: booking.id } });
        expect(updatedBooking?.status).toBe('cancelled');
        expect(updatedBooking?.paymentStatus).toBe('refunded');
    });
});
