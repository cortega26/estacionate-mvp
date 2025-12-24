
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from '../src/lib/db.js';
import { BookingService } from '../src/services/BookingService.js';
import { PaymentService } from '../src/services/PaymentService.js';

// Mock dependencies
vi.mock('../src/services/PaymentService.js', () => ({
    PaymentService: {
        createPreference: vi.fn(), // Mock MP calls
        refundPayment: vi.fn()
    }
}));

// Mock EventBus to avoid side effects
vi.mock('../src/lib/event-bus.js', () => ({
    EventBus: {
        getInstance: () => ({ publish: vi.fn() })
    },
    EventType: {
        BOOKING_CREATED: 'BOOKING_CREATED',
        SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
        BOOKING_CANCELLED: 'BOOKING_CANCELLED'
    }
}));

describe('BookingService Concurrency (Phase 2)', () => {
    let spotId: string;
    let residentId: string;
    let residentId2: string;
    let blockId: string;

    beforeEach(async () => {
        // Use shorter random numbers to avoid VarChar(10) overflow (Spot Number default)
        const id = Math.floor(Math.random() * 90000) + 10000; // 5 digits guaranteed

        // Setup Building & Spot
        const building = await db.building.create({
            data: { name: `Conc-Test-${id}`, address: '123', contactEmail: `c-${id}@t.com`, totalUnits: 10 }
        });

        const spot = await db.visitorSpot.create({
            data: { buildingId: building.id, spotNumber: `C-${id}` } // C-12345 (7 chars) < 10 chars
        });
        spotId = spot.id;

        const unit = await db.unit.create({ data: { buildingId: building.id, unitNumber: `${id}` } });

        const res1 = await db.resident.create({
            data: { unitId: unit.id, email: `r1-${id}@c.com`, rut: `1-${id}`, firstName: 'R1', lastName: 'T' }
        });
        residentId = res1.id;

        const res2 = await db.resident.create({
            data: { unitId: unit.id, email: `r2-${id}@c.com`, rut: `2-${id}`, firstName: 'R2', lastName: 'T' }
        });
        residentId2 = res2.id;

        // Setup 1 Block
        const block = await db.availabilityBlock.create({
            data: {
                spotId: spot.id,
                startDatetime: new Date(Date.now() + 1000000), // Future
                endDatetime: new Date(Date.now() + 2000000),
                durationType: 'ELEVEN_HOURS',
                basePriceClp: 5000,
                status: 'available'
            }
        });
        blockId = block.id;
    });

    it('should PREVENT double booking of the SAME block concurrently', async () => {
        // Simulate 2 requests hitting at exact same time with same blockId
        const bookingReq1 = BookingService.createBooking(
            { userId: residentId, role: 'resident', buildingId: null },
            { blockId, vehiclePlate: 'AAAA11', visitorName: 'Visitor1' },
            { ip: '1.1.1.1', userAgent: 'test', country: 'CL' }
        );

        const bookingReq2 = BookingService.createBooking(
            { userId: residentId2, role: 'resident', buildingId: null },
            { blockId, vehiclePlate: 'BBBB22', visitorName: 'Visitor2' },
            { ip: '2.2.2.2', userAgent: 'test', country: 'CL' }
        );

        // Await both
        const results = await Promise.allSettled([bookingReq1, bookingReq2]);

        // One should succeed, one should fail
        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');

        if (rejected.length === 2) {
            console.error('BOTH REJECTED:', rejected.map(r => (r as PromiseRejectedResult).reason));
        }

        expect(fulfilled.length).toBe(1);
        expect(rejected.length).toBe(1);

        // Verify failure reason
        const error = (rejected[0] as PromiseRejectedResult).reason;
        expect(error.message).toMatch(/Spot is no longer available/);
    });
});
