import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { PrismaClient, DurationType } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Admin API Integration Tests', () => {
    let adminToken: string;
    let buildingAdminToken: string;
    let residentToken: string;

    let buildingId: string;
    let otherBuildingId: string;
    let adminId: string;
    let buildingAdminId: string;
    let residentId: string;

    let spotId: string;
    let blockId: string;
    let unique: string;

    beforeAll(async () => {
        try {
            unique = crypto.randomUUID();

            // 1. Create Buildings
            const building = await prisma.building.create({
                data: {
                    name: `Admin Building ${unique}`,
                    address: 'Admin St',
                    totalUnits: 10,
                    platformCommissionRate: 0.1,
                    contactEmail: `admin-bld-${unique}@test.com`
                }
            });
            buildingId = building.id;

            const otherBuilding = await prisma.building.create({
                data: {
                    name: `Other Admin Building ${unique}`,
                    address: 'Other Admin St',
                    totalUnits: 5,
                    contactEmail: `other-admin-${unique}@test.com`
                }
            });
            otherBuildingId = otherBuilding.id;

            // 2. Create Users & Tokens
            // Super Admin
            const admin = await prisma.user.create({
                data: {
                    email: `superadmin-${unique}@test.com`,
                    passwordHash: 'hash',
                    role: 'admin',
                    isActive: true
                }
            });
            adminId = admin.id;
            adminToken = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '1h' });

            // Building Admin (Assigned to buildingId)
            const bAdmin = await prisma.user.create({
                data: {
                    email: `badmin-${unique}@test.com`,
                    passwordHash: 'hash',
                    role: 'building_admin',
                    buildingId: buildingId,
                    isActive: true
                }
            });
            buildingAdminId = bAdmin.id;
            buildingAdminToken = jwt.sign({ id: bAdmin.id, email: bAdmin.email, role: bAdmin.role, buildingId: bAdmin.buildingId }, JWT_SECRET, { expiresIn: '1h' });

            // Resident (No dashboard access)
            const unit = await prisma.unit.create({ data: { buildingId, unitNumber: '101' } });
            const resident = await prisma.resident.create({
                data: { unitId: unit.id, email: `res-${unique}@test.com`, firstName: 'R', lastName: 'D', rut: `${unique.substring(0, 8)}-K`, isVerified: true }
            });
            residentId = resident.id;
            residentToken = jwt.sign({ id: resident.id, email: resident.email, role: 'resident' }, JWT_SECRET, { expiresIn: '1h' }); // Residents usually don't have 'role' in JWT but let's simulate authentication

            // 3. Data for Stats
            // Create Spot
            const spot = await prisma.visitorSpot.create({ data: { buildingId, spotNumber: 'V-1' } });
            spotId = spot.id;

            // Create Completed Booking (Revenue)
            // Block must exist
            const past = new Date();
            past.setDate(past.getDate() - 1);
            const block = await prisma.availabilityBlock.create({
                data: {
                    spotId,
                    startDatetime: past,
                    endDatetime: new Date(past.getTime() + 11 * 3600 * 1000),
                    durationType: DurationType.ELEVEN_HOURS,
                    basePriceClp: 5000,
                    status: 'available' // Techincally 'booked' but for stats we join Booking
                }
            });

            await prisma.booking.create({
                data: {
                    availabilityBlockId: block.id,
                    residentId,
                    vehiclePlate: 'ADM-123',
                    visitorName: 'Visitor',
                    amountClp: 5500,
                    commissionClp: 500,
                    status: 'completed',
                    paymentStatus: 'paid',
                    confirmationCode: 'ADM-1'
                }
            });

            // Create Future Block (For Price Update Test)
            const future = new Date();
            future.setDate(future.getDate() + 5);
            const futureBlock = await prisma.availabilityBlock.create({
                data: {
                    spotId,
                    startDatetime: future,
                    endDatetime: new Date(future.getTime() + 11 * 3600 * 1000),
                    durationType: DurationType.ELEVEN_HOURS,
                    basePriceClp: 5000,
                    status: 'available'
                }
            });
            blockId = futureBlock.id;

        } catch (e) {
            console.error('SETUP FAILED:', e);
            throw e;
        }
    });

    afterAll(async () => {
        try {
            await prisma.booking.deleteMany({ where: { residentId } });
            await prisma.availabilityBlock.deleteMany({ where: { spotId } });
            await prisma.visitorSpot.deleteMany({ where: { id: spotId } });
            await prisma.resident.deleteMany({ where: { id: residentId } });
            await prisma.unit.deleteMany({ where: { buildingId } });
            await prisma.user.deleteMany({ where: { id: { in: [adminId, buildingAdminId] } } });
            await prisma.building.deleteMany({ where: { id: { in: [buildingId, otherBuildingId] } } });
        } catch (e) {
            console.error('cleanup failed', e);
        } finally {
            await prisma.$disconnect();
        }
    });

    // --- RBAC Tests ---
    it('should deny access without token', async () => {
        const res = await request(app).get('/api/admin/stats');
        expect(res.status).toBe(401);
    });

    it('should deny access to regular resident', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${residentToken}`);
        expect(res.status).toBe(403);
    });

    // --- Stats API ---
    it('should return stats for Super Admin (All Buildings)', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.revenue).toBeGreaterThanOrEqual(5500);
    });

    it('should return stats for Building Admin (Own Building)', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .query({ buildingId }) // Even if they query, implementation forces their ID
            .set('Authorization', `Bearer ${buildingAdminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.revenue).toBe(5500);
    });

    it('should deny Building Admin accessing other building', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .query({ buildingId: otherBuildingId })
            .set('Authorization', `Bearer ${buildingAdminToken}`);

        // The implementation: "if (buildingId && buildingId !== user.buildingId) return 403"
        expect(res.status).toBe(403);
    });

    // --- Buildings API ---
    it('should list buildings for Super Admin', async () => {
        const res = await request(app)
            .get('/api/admin/buildings')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.some((b: any) => b.id === buildingId)).toBe(true);
        expect(res.body.data.some((b: any) => b.id === otherBuildingId)).toBe(true);
    });

    // --- Prices API ---
    it('should update prices for future blocks', async () => {
        const newPrice = 8000;
        const res = await request(app)
            .put('/api/admin/prices')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ buildingId, newPrice });

        expect(res.status).toBe(200);
        expect(res.body.updatedCount).toBeGreaterThanOrEqual(1);

        // Verify DB update
        const updatedBlock = await prisma.availabilityBlock.findUnique({ where: { id: blockId } });
        expect(updatedBlock?.basePriceClp).toBe(newPrice);
    });
});
