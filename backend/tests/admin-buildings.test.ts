
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

describe('DELETE /api/admin/buildings', () => {
    const adminToken = signToken({ userId: 'admin-1', role: 'admin' });

    it('should delete an empty building', async () => {
        const building = await db.building.create({
            data: {
                name: 'To Delete',
                address: '123 Del St',
                contactEmail: 'del@test.com',
                totalUnits: 0
            }
        });

        const res = await request(app)
            .delete(`/api/admin/buildings?id=${building.id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);

        const check = await db.building.findUnique({ where: { id: building.id } });
        expect(check).toBeNull();
    });

    it('should fail to delete building with active bookings', async () => {
        // Setup Building with Dependency
        const building = await db.building.create({
            data: {
                name: 'Delete Fail',
                address: '123 Fail St',
                contactEmail: 'fail@test.com',
                totalUnits: 1
            }
        });

        const spot = await db.visitorSpot.create({
            data: {
                buildingId: building.id,
                spotNumber: 'F-1'
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

        const unit = await db.unit.create({
            data: {
                buildingId: building.id,
                unitNumber: 'U-F'
            }
        });

        const resident = await db.resident.create({
            data: {
                unitId: unit.id,
                email: `fail-${Date.now()}@test.com`,
                rut: '1-9',
                firstName: 'Fail',
                lastName: 'Resident'
            }
        });

        await db.booking.create({
            data: {
                residentId: resident.id,
                availabilityBlockId: block.id,
                visitorName: 'Fail',
                vehiclePlate: 'FAIL',
                amountClp: 5000,
                commissionClp: 500,
                status: 'pending',
                confirmationCode: `F${Math.floor(Math.random() * 10000)}`
            }
        });

        const res = await request(app)
            .delete(`/api/admin/buildings?id=${building.id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(409);
        expect(res.body.error).toContain('Cannot delete building');
    });

    it('should fail to delete building with just a resident (no bookings) due to Resident->Unit constraint', async () => {
        const building = await db.building.create({
            data: { name: 'Res Constraint', address: '123 R St', contactEmail: 'r@test.com', totalUnits: 1 }
        });
        const unit = await db.unit.create({
            data: { buildingId: building.id, unitNumber: 'U-R' }
        });
        await db.resident.create({
            data: { unitId: unit.id, email: `res-only-${Date.now()}@test.com`, rut: '1-9', firstName: 'Res', lastName: 'Only' }
        });

        const res = await request(app)
            .delete(`/api/admin/buildings?id=${building.id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(409);
    });


    it('should force delete building with complex dependencies when force=true', async () => {
        // Setup Complex Building
        const building = await db.building.create({
            data: {
                name: 'Force Delete',
                address: '123 F St',
                contactEmail: 'f@test.com',
                totalUnits: 1
            }
        });

        const unit = await db.unit.create({
            data: { buildingId: building.id, unitNumber: 'U-F' }
        });

        const resident = await db.resident.create({
            data: {
                unitId: unit.id,
                email: `force-${Date.now()}@test.com`,
                rut: '1-9',
                firstName: 'F',
                lastName: 'D'
            }
        });

        const spot = await db.visitorSpot.create({
            data: { buildingId: building.id, spotNumber: 'S-F' }
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

        const booking = await db.booking.create({
            data: {
                residentId: resident.id,
                availabilityBlockId: block.id,
                visitorName: 'Force Visitor',
                vehiclePlate: 'FORCE',
                amountClp: 5000,
                commissionClp: 500,
                status: 'pending',
                confirmationCode: `FC${Math.floor(Math.random() * 10000)}`
            }
        });

        // Add payment to verify it gets cleaned up (Payment restricts Booking)
        await db.payment.create({
            data: {
                bookingId: booking.id,
                amountClp: 5000,
                status: 'pending'
            }
        });

        const res = await request(app)
            .delete(`/api/admin/buildings?id=${building.id}&force=true`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const check = await db.building.findUnique({ where: { id: building.id } });
        expect(check).toBeNull();

        // Check dependencies gone
        const checkUnit = await db.unit.findUnique({ where: { id: unit.id } });
        expect(checkUnit).toBeNull();
    });
});
