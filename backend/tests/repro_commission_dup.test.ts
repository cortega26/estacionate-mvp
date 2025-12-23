
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../src/lib/db.js';
import { SalesService } from '../src/services/SalesService.js';

describe('SalesService Idempotency', () => {
    let salesRepId: string;
    let buildingId: string;
    let payoutId: string;

    beforeAll(async () => {
        // Cleanup
        await db.salesRepCommission.deleteMany({ where: { payoutId: 'test-payout-idempotency' } });
        await db.payout.deleteMany({ where: { id: 'test-payout-idempotency' } });

        // Setup Data
        // 1. Create Sales Rep (User)
        const salesRep = await db.user.upsert({
            where: { email: 'test-sales-rep@example.com' },
            update: {},
            create: {
                email: 'test-sales-rep@example.com',
                passwordHash: 'hash',
                role: 'sales_rep',
                isActive: true
            }
        });
        salesRepId = salesRep.id;

        // 2. Create Building assigned to Sales Rep
        const building = await db.building.upsert({
            where: { id: 'test-building-idempotency' },
            update: { salesRepId: salesRep.id, salesRepCommissionRate: 0.05 },
            create: {
                id: 'test-building-idempotency',
                name: 'Test Building Idempotency',
                address: '123 Test St',
                contactEmail: 'test@building.com',
                totalUnits: 10,
                salesRepId: salesRep.id,
                salesRepCommissionRate: 0.05
            }
        });
        buildingId = building.id;

        // 3. Create Payout
        const payout = await db.payout.create({
            data: {
                id: 'test-payout-idempotency',
                buildingId: building.id,
                periodStart: new Date(),
                periodEnd: new Date(),
                totalRevenueClp: 100000,
                platformCommissionClp: 10000, // 10%
                buildingShareClp: 90000,
                status: 'calculated'
            }
        });
        payoutId = payout.id;
    });

    afterAll(async () => {
        // Cleanup
        await db.salesRepCommission.deleteMany({ where: { payoutId: 'test-payout-idempotency' } });
        await db.payout.deleteMany({ where: { id: 'test-payout-idempotency' } });
        // Keeping User/Building for other tests or manual cleanup usually
    });

    it('should NOT create duplicate commissions when called twice', async () => {
        const payout = await db.payout.findUniqueOrThrow({ where: { id: payoutId } });

        // Call Concurrently (Simulate Race Condition)
        await Promise.all([
            SalesService.calculateCommission(payout),
            SalesService.calculateCommission(payout),
            SalesService.calculateCommission(payout)
        ]);

        // Assert
        const commissions = await db.salesRepCommission.findMany({
            where: { payoutId: payout.id }
        });



        // EXPECT FAILURE INITIALLY: The bug is that it creates 2
        // We want to assert that it SHOULD be 1.
        expect(commissions.length).toBe(1);
    });
});
