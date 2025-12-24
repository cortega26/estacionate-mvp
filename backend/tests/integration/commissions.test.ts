
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../../src/lib/db.js';
import { SalesService } from '../../src/services/SalesService.js';

describe('Sales Commission Integration', () => {
    let salesRepId: string;
    let buildingId: string;

    // cleanup helper
    const cleanup = async () => {
        await db.salesRepCommission.deleteMany({ where: { buildingId } });
        await db.payout.deleteMany({ where: { buildingId } });
        // Don't delete building/user in beforeEach to save time, assume unique IDs help isolation or beforeAll setup.
    };

    beforeAll(async () => {
        // 1. Create Sales Rep
        const salesRep = await db.user.upsert({
            where: { email: 'commission-test-rep@example.com' },
            update: {},
            create: {
                email: 'commission-test-rep@example.com',
                passwordHash: 'hash',
                role: 'sales_rep',
                isActive: true
            }
        });
        salesRepId = salesRep.id;

        // 2. Create Building
        const building = await db.building.upsert({
            where: { id: 'commission-test-building' },
            update: { salesRepId: salesRep.id },
            create: {
                id: 'commission-test-building',
                name: 'Commission Test Building',
                address: '123 Test St',
                contactEmail: 'test@building.com',
                totalUnits: 100,
                salesRepId: salesRep.id,
                salesRepCommissionRate: 0.05 // 5%
            }
        });
        buildingId = building.id;
    });

    beforeEach(async () => {
        await cleanup();
    });

    afterAll(async () => {
        await cleanup();
        await db.building.delete({ where: { id: buildingId } });
        await db.user.delete({ where: { id: salesRepId } });
    });

    it('should calculate correct 5% commission for standard payout', async () => {
        // Create Payout
        const payout = await db.payout.create({
            data: {
                buildingId,
                periodStart: new Date('2025-01-01'),
                periodEnd: new Date('2025-01-31'),
                totalRevenueClp: 1000000,
                platformCommissionClp: 100000, // 10%
                buildingShareClp: 900000,
                status: 'calculated' // Note: This exceeds varchar(20)? No, "calculated" is 10 chars.
            }
        });

        // Calculate
        const commission = await SalesService.calculateCommission(payout);

        // Assert
        expect(commission).toBeDefined();
        // 5% of Platform Commission (100,000) = 5,000
        expect(commission?.amountClp).toBe(5000);
        expect(commission?.salesRepId).toBe(salesRepId);
        expect(commission?.payoutId).toBe(payout.id);
    });

    it('should be idempotent (handle race conditions)', async () => {
        const payout = await db.payout.create({
            data: {
                buildingId,
                periodStart: new Date('2025-02-01'),
                periodEnd: new Date('2025-02-28'),
                totalRevenueClp: 500000,
                platformCommissionClp: 50000,
                buildingShareClp: 450000,
                status: 'calculated'
            }
        });

        // Race Condition Simulation
        const results = await Promise.all([
            SalesService.calculateCommission(payout),
            SalesService.calculateCommission(payout),
            SalesService.calculateCommission(payout)
        ]);

        // Verify only 1 record exists in DB
        const dbRecords = await db.salesRepCommission.findMany({
            where: { payoutId: payout.id }
        });
        expect(dbRecords.length).toBe(1);

        // Verify all function calls returned defined objects (either created or found existing)
        const validResults = results.filter(r => r !== undefined);
        expect(validResults.length).toBe(3);
        expect(validResults[0]?.id).toBe(validResults[1]?.id);
    });

    it('should skip commission if building has no sales rep', async () => {
        // Unset Sales Rep
        await db.building.update({
            where: { id: buildingId },
            data: { salesRepId: null }
        });

        const payout = await db.payout.create({
            data: {
                buildingId,
                periodStart: new Date('2025-03-01'),
                periodEnd: new Date('2025-03-31'),
                totalRevenueClp: 100000,
                platformCommissionClp: 10000,
                buildingShareClp: 90000,
                status: 'calculated'
            }
        });

        const commission = await SalesService.calculateCommission(payout);
        expect(commission).toBeUndefined();

        const count = await db.salesRepCommission.count({ where: { payoutId: payout.id } });
        expect(count).toBe(0);

        // Restore Sales Rep
        await db.building.update({
            where: { id: buildingId },
            data: { salesRepId }
        });
    });

    it('should skip commission if amount is zero', async () => {
        const payout = await db.payout.create({
            data: {
                buildingId,
                periodStart: new Date('2025-04-01'),
                periodEnd: new Date('2025-04-30'),
                totalRevenueClp: 0,
                platformCommissionClp: 0,
                buildingShareClp: 0,
                status: 'calculated'
            }
        });

        const commission = await SalesService.calculateCommission(payout);
        expect(commission).toBeUndefined();
    });
});
