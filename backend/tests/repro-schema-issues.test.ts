import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../src/lib/db.js';
import { addDays, startOfYesterday, endOfYesterday } from 'date-fns';
import { DurationType } from '@prisma/client';

describe('Schema Vulnerability Reproduction', () => {
    let buildingId: string;
    let spotId: string;

    beforeAll(async () => {
        // Setup Building and Spot
        const building = await db.building.create({
            data: {
                name: 'Repro Building',
                address: '123 Fake St',
                adminCompany: 'Repro Corp',
                contactEmail: 'repro@example.com',
                totalUnits: 10,
            }
        });
        buildingId = building.id;

        const spot = await db.visitorSpot.create({
            data: {
                buildingId: building.id,
                spotNumber: 'R-1',
                isActive: true
            }
        });
        spotId = spot.id;
    });

    afterAll(async () => {
        // Cleanup
        await db.availabilityBlock.deleteMany({ where: { spotId } });
        await db.payout.deleteMany({ where: { buildingId } });
        await db.visitorSpot.deleteMany({ where: { buildingId } });
        await db.building.deleteMany({ where: { id: buildingId } });
    });

    it('PERMITS overlapping availability blocks (Availability Integrity)', async () => {
        const start1 = new Date();
        const end1 = addDays(start1, 1);

        // Block 1: Today -> Tomorrow
        await db.availabilityBlock.create({
            data: {
                spotId,
                startDatetime: start1,
                endDatetime: end1,
                durationType: DurationType.TWENTY_THREE_HOURS,
                basePriceClp: 5000,
                status: 'available'
            }
        });

        const start2 = new Date(start1.getTime() + 1000 * 60 * 60); // 1 hour later
        const end2 = new Date(end1.getTime() + 1000 * 60 * 60);

        // Block 2: Overlapping
        const overlapBlock = await db.availabilityBlock.create({
            data: {
                spotId,
                startDatetime: start2,
                endDatetime: end2,
                durationType: DurationType.TWENTY_THREE_HOURS,
                basePriceClp: 5000,
                status: 'available'
            }
        });

        // Ensure we successfully created an overlapping block (Vulnerability Confirmation)
        expect(overlapBlock).toBeDefined();
        expect(overlapBlock.id).toBeDefined();
    });

    it('REJECTS duplicate payouts (Financial Integrity)', async () => {
        const periodStart = startOfYesterday();
        const periodEnd = endOfYesterday();

        // Payout 1
        await db.payout.create({
            data: {
                buildingId,
                periodStart,
                periodEnd,
                totalRevenueClp: 10000,
                platformCommissionClp: 1000,
                buildingShareClp: 9000,
                status: 'calculated'
            }
        });

        // Payout 2 (Duplicate) - Should Fail
        await expect(db.payout.create({
            data: {
                buildingId,
                periodStart,
                periodEnd,
                totalRevenueClp: 10000,
                platformCommissionClp: 1000,
                buildingShareClp: 9000,
                status: 'calculated'
            }
        })).rejects.toThrow('Unique constraint failed');
    });
});
