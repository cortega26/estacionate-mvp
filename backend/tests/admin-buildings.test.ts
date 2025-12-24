
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { db } from '../src/lib/db.js';
import { signToken } from '../src/services/auth.js';

// Mock specific database calls we don't want to run against real DB if avoiding side effects,
// but for integration we want real DB. 
// However, since we used raw query, we need to ensure the test DB has data.

describe('GET /api/admin/buildings', () => {
    const adminToken = signToken({ userId: 'admin-1', role: 'admin' });

    it('should calculate revenue using raw SQL correctly', async () => {
        // Setup Data
        const building = await db.building.create({
            data: {
                name: 'Test Building Revenue',
                address: '123 Test St',
                contactEmail: 'test@test.com',
                totalUnits: 10
            }
        });

        const spot = await db.visitorSpot.create({
            data: {
                buildingId: building.id,
                spotNumber: `T-${Math.floor(Math.random() * 10000)}`
            }
        });

        const block = await db.availabilityBlock.create({
            data: {
                spotId: spot.id,
                startDatetime: new Date(),
                endDatetime: new Date(),
                durationType: 'ELEVEN_HOURS',
                basePriceClp: 5000,
                status: 'reserved'
            }
        });

        // Create a completed booking
        const unit = await db.unit.create({
            data: {
                buildingId: building.id,
                unitNumber: `U-${Math.floor(Math.random() * 10000)}`
            }
        });

        const resident = await db.resident.create({
            data: {
                unitId: unit.id,
                email: `res-test-${Date.now()}-${Math.random()}@test.com`,
                rut: '1-9',
                firstName: 'Test',
                lastName: 'Resident'
            }
        });

        // Create a completed booking
        await db.booking.create({
            data: {
                residentId: resident.id,
                availabilityBlockId: block.id,
                visitorName: 'John',
                vehiclePlate: `AB${Math.floor(Math.random() * 1000)}`,
                amountClp: 10000,
                commissionClp: 1000,
                status: 'completed',
                confirmationCode: `C${Math.floor(Math.random() * 10000)}`,
                paymentStatus: 'paid'
            }
        });

        // Actually, let's just mock the raw query response to verify the API Logic handles the mapping correctly.
        // Testing the actual SQL execution requires a full DB setup which might be complex here.
        // Given the goal is "Verify changes", testing the mapping logic is valuable.

        // True Integration: We rely on the real DB execution of the Raw Query.
        // The data created above: One booking with 10000 CLP.

        const res = await request(app)
            .get('/api/admin/buildings')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const b = res.body.data.find((x: any) => x.id === building.id);
        expect(b).toBeDefined();

        // 10000 revenue from the created booking
        // Platform comm rate default 0.10 -> 1000
        // Software fee default 0 -> 0
        // Total earnings -> 1000
        expect(b.stats.totalRevenueClp).toBe(10000);
        expect(b.stats.platformCommissionClp).toBe(1000); // 10%

        vi.restoreAllMocks();
    });
});
