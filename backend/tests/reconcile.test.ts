import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../src/api/cron/reconcile.js';
import { SalesService } from '../src/services/SalesService.js';

// Mock DB
const { mockDb } = vi.hoisted(() => {
    return {
        mockDb: {
            building: { findMany: vi.fn() },
            payout: { findFirst: vi.fn(), create: vi.fn() },
            booking: { findMany: vi.fn() }
        }
    }
});

vi.mock('../src/lib/db.js', () => ({ db: mockDb }));

// Spy Sales Service
const calculateCommissionSpy = vi.spyOn(SalesService, 'calculateCommission');

describe('Reconciliation Job (Unit)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        calculateCommissionSpy.mockResolvedValue({} as any);
    });

    it('should correctly calculate revenue and create payout', async () => {
        // Mock Data
        mockDb.building.findMany.mockResolvedValue([
            { id: 'b1', name: 'Build 1' }
        ]);
        mockDb.payout.findFirst.mockResolvedValue(null); // No existing payout
        mockDb.booking.findMany.mockResolvedValue([
            {
                id: 'bk1',
                amountClp: 10000,
                commissionClp: 1000,
                payment: { amountClp: 10000 } // Paid fully
            }
        ]);
        const mockCreatedPayout = {
            id: 'p1',
            totalRevenueClp: 10000,
            buildingShareClp: 9000 // 10000 - 1000
        };
        mockDb.payout.create.mockResolvedValue(mockCreatedPayout);

        const req = { method: 'POST' } as any;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as any;

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            results: expect.arrayContaining([
                expect.objectContaining({
                    building: 'Build 1',
                    status: 'created',
                    revenue: 10000
                })
            ])
        }));

        // Verify Payout Create
        expect(mockDb.payout.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                buildingId: 'b1',
                totalRevenueClp: 10000,
                platformCommissionClp: 1000,
                buildingShareClp: 9000,
                status: 'calculated'
            })
        }));

        // Verify Commission Calculation
        expect(calculateCommissionSpy).toHaveBeenCalledWith(mockCreatedPayout);
    });

    it('should be idempotent (skip if payout exists)', async () => {
        mockDb.building.findMany.mockResolvedValue([
            { id: 'b1', name: 'Build 1' }
        ]);
        mockDb.payout.findFirst.mockResolvedValue({ id: 'existing_payout' }); // Exists

        const req = { method: 'POST' } as any;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as any;

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            results: expect.arrayContaining([
                expect.objectContaining({
                    status: 'skipped_exists'
                })
            ])
        }));

        expect(mockDb.payout.create).not.toHaveBeenCalled();
    });

    it('should handle race condition (P2002) gracefully', async () => {
        mockDb.building.findMany.mockResolvedValue([
            { id: 'b1', name: 'Build 1' }
        ]);
        mockDb.payout.findFirst.mockResolvedValue(null);
        mockDb.booking.findMany.mockResolvedValue([]);

        // Simulate Race Condition
        const p2002 = new Error('Unique constraint');
        (p2002 as any).code = 'P2002';
        mockDb.payout.create.mockRejectedValue(p2002);

        const req = { method: 'POST' } as any;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as any;

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            results: expect.arrayContaining([
                expect.objectContaining({ status: 'skipped_race_condition' })
            ])
        }));
    });

    it('should handle building deletion race condition (P2003) gracefully', async () => {
        mockDb.building.findMany.mockResolvedValue([
            { id: 'b1', name: 'Build 1' }
        ]);
        mockDb.payout.findFirst.mockResolvedValue(null);
        mockDb.booking.findMany.mockResolvedValue([]);

        // Simulate Building Deleted
        const p2003 = new Error('Foreign key constraint');
        (p2003 as any).code = 'P2003';
        mockDb.payout.create.mockRejectedValue(p2003);

        const req = { method: 'POST' } as any;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as any;

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            results: expect.arrayContaining([
                expect.objectContaining({ status: 'skipped_building_deleted' })
            ])
        }));
    });
});
