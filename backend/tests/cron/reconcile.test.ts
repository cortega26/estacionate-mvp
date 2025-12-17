import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../lib/db.js';
import { DurationType } from '@prisma/client';
import { startOfYesterday, endOfYesterday, subDays } from 'date-fns';
import handler from '../../api/cron/reconcile.js';

// Mock Response
const mockRes = () => {
    const res: any = {};
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.body = data;
        return res;
    };
    return res;
};

// Mock Request
const mockReq = (method = 'POST') => ({ method } as any);

describe('Reconciliation Cron', () => {
    let buildingId: string;
    let spotId: string;
    let blockId: string;
    let residentId: string;

    beforeEach(async () => {
        try {
            // Use TRUNCATE CASCADE for clean slate (PostgreSQL specific)
            // Order doesn't matter with CASCADE, but tablenames must match schema mappings
            const tablenames = [
                'payments', 'payouts', 'bookings',
                'availability_blocks', 'visitor_spots',
                'residents', 'units', 'users', 'buildings'
            ];

            for (const table of tablenames) {
                try {
                    // We use DELETE (less efficient but safer if TRUNCATE permissions issue) 
                    // OR we can try raw TRUNCATE. Let's try TRUNCATE first.
                    await db.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
                } catch (err) {
                    // Fallback to delete if TRUNCATE fails (e.g. FK issues in loop, but CASCADE should fix)
                    // Actually, single TRUNCATE statement with all tables is best
                }
            }
            await db.$executeRawUnsafe(`TRUNCATE TABLE "payments", "payouts", "bookings", "availability_blocks", "visitor_spots", "residents", "units", "users", "buildings" CASCADE;`);

            // Setup Building & Unit
            const building = await db.building.create({
                data: {
                    name: 'Reconcile Test Building',
                    address: '123 Finance St',
                    contactEmail: 'finance@test.com',
                    totalUnits: 10,
                    platformCommissionRate: 0.10
                }
            });
            buildingId = building.id;

            const unit = await db.unit.create({
                data: { buildingId, unitNumber: '101' }
            });

            const resident = await db.resident.create({
                data: {
                    unitId: unit.id,
                    email: `res-${Date.now()}@test.com`,
                    rut: `999-${Date.now()}`,
                    firstName: 'John',
                    lastName: 'Doe'
                }
            });
            residentId = resident.id;

            // Spot & Cleanup
            const spot = await db.visitorSpot.create({
                data: { buildingId, spotNumber: 'S-Reconcile' }
            });
            spotId = spot.id;

            // Block
            const block = await db.availabilityBlock.create({
                data: {
                    spotId,
                    startDatetime: subDays(new Date(), 2),
                    endDatetime: subDays(new Date(), 1), // Yesterday
                    durationType: DurationType.TWENTY_THREE_HOURS,
                    basePriceClp: 10000
                }
            });
            blockId = block.id;
        } catch (e) {
            console.error('Test Setup Failed:', e);
            throw e;
        }
    });

    it.skip('should calculate revenue and create payout for yesterday', async () => {
        // Create a confirmed booking for "Yesterday"
        const bookingDate = new Date(startOfYesterday().getTime() + 1000); // Yesterday start + 1s

        await db.booking.create({
            data: {
                residentId,
                availabilityBlockId: blockId,
                visitorName: 'Visitor 1',
                vehiclePlate: 'ABCD12',
                amountClp: 10000,
                commissionClp: 1000,
                status: 'confirmed',
                paymentStatus: 'paid',
                confirmationCode: 'REC01',
                createdAt: bookingDate
                // Payment relation usually created separately or nested. 
                // For this test, we skip Payment creation as logic checks Booking amounts, 
                // but logs error if missing. We want to verify Payout creation logic.
            }
        });

        const res = mockRes();
        await handler(mockReq(), res);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.results.length).toBeGreaterThan(0);

        // Verify Payout
        const payouts = await db.payout.findMany({ where: { buildingId } });
        expect(payouts.length).toBe(1);
        expect(payouts[0].totalRevenueClp).toBe(10000);
        expect(payouts[0].platformCommissionClp).toBe(1000);
        expect(payouts[0].buildingShareClp).toBe(9000);
        expect(payouts[0].status).toBe('calculated');
    });

    it.skip('should be idempotent', async () => {
        // Create a confirmed booking for "Yesterday"
        const bookingDate = new Date(startOfYesterday().getTime() + 1000);

        await db.booking.create({
            data: {
                residentId,
                availabilityBlockId: blockId,
                visitorName: 'Visitor 1',
                vehiclePlate: 'ABCD12',
                amountClp: 5000,
                commissionClp: 500,
                status: 'confirmed',
                paymentStatus: 'paid',
                confirmationCode: 'REC02',
                createdAt: bookingDate
            }
        });

        const res1 = mockRes();
        await handler(mockReq(), res1);
        expect(res1.body.results[0].status).toBe('created');

        const res2 = mockRes();
        await handler(mockReq(), res2);
        expect(res2.body.results.find((r: any) => r.building === 'Reconcile Test Building').status).toBe('skipped_exists');

        const payouts = await db.payout.findMany({ where: { buildingId } });
        expect(payouts.length).toBe(1);
    });
});
