import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { PrismaClient, DurationType, Role } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

describe('Coverage Gap Fillers', () => {
    let buildingId: string;
    let spotId: string;
    let blockId: string;
    let residentId: string;
    let adminId: string;
    let unitId: string;

    beforeAll(async () => {
        try {
            // Setup
            const unique = crypto.randomUUID();
            const building = await prisma.building.create({
                data: { name: `Coverage Building ${unique}`, address: 'Cov St', totalUnits: 1, platformCommissionRate: 0.1, contactEmail: `cov-${unique}@test.com` }
            });
            buildingId = building.id;

            const spot = await prisma.visitorSpot.create({ data: { buildingId, spotNumber: 'V-COV' } });
            spotId = spot.id;

            // Create Resident (for simple auth)
            const unit = await prisma.unit.create({ data: { buildingId, unitNumber: '101' } });
            unitId = unit.id;

            // Note: We create resident with a DUMMY hash initially.
            // For login tests, we update it to a known hash.
            const resident = await prisma.resident.create({
                data: { unitId: unit.id, email: `cov-res-${unique}@test.com`, firstName: 'A', lastName: 'B', rut: `${unique.substring(0, 8)}-K`, isVerified: true, passwordHash: 'hash' }
            });
            residentId = resident.id;

            // Create Admin (User table) for Login Coverage
            const bcrypt = await import('bcryptjs');
            const adminHash = await bcrypt.hash('password123', 10);

            const admin = await prisma.user.create({
                data: {
                    email: `cov-admin-${unique}@test.com`,
                    passwordHash: adminHash,
                    role: Role.admin,
                    isActive: true
                }
            });
            adminId = admin.id;

        } catch (e) {
            console.error('SETUP FAILED:', e);
            throw e;
        }
    });

    afterAll(async () => {
        try {
            if (blockId) await prisma.availabilityBlock.delete({ where: { id: blockId } });
            if (residentId) await prisma.resident.delete({ where: { id: residentId } });
            if (adminId) await prisma.user.delete({ where: { id: adminId } });
            if (unitId) await prisma.unit.delete({ where: { id: unitId } });
            if (spotId) await prisma.visitorSpot.delete({ where: { id: spotId } });
            if (buildingId) await prisma.building.delete({ where: { id: buildingId } });
        } catch (e) {
            console.error('cleanup failed', e);
        } finally {
            await prisma.$disconnect();
        }
    });

    it('should login successfully as Admin (User Table coverage)', async () => {
        const admin = await prisma.user.findUniqueOrThrow({ where: { id: adminId } });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: admin.email,
                password: 'password123'
            });

        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe('admin');
    });

    it('should reject inactive admin login', async () => {
        await prisma.user.update({ where: { id: adminId }, data: { isActive: false } });
        const admin = await prisma.user.findUniqueOrThrow({ where: { id: adminId } });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: admin.email,
                password: 'password123'
            });

        expect(res.status).toBe(403);
        expect(res.body.error || res.body.message).toMatch(/unavailable|inactive|not allowed/i);
    });

    it('should reject booking in the past (PAST_TIME)', async () => {
        const start = new Date();
        start.setHours(start.getHours() - 2);
        const end = new Date();
        end.setHours(end.getHours() - 1);

        const block = await prisma.availabilityBlock.create({
            data: {
                spotId,
                startDatetime: start,
                endDatetime: end,
                durationType: DurationType.ELEVEN_HOURS,
                basePriceClp: 5000,
                status: 'available'
            }
        });
        blockId = block.id;

        // Update Resident Hash for Login
        const bcrypt = await import('bcryptjs');
        const hash = await bcrypt.hash('password123', 10);
        await prisma.resident.update({ where: { id: residentId }, data: { passwordHash: hash } });

        const resident = await prisma.resident.findUniqueOrThrow({ where: { id: residentId } });

        // Login via supertest
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: resident.email,
                password: 'password123'
            });

        const cookies = loginRes.headers['set-cookie'];
        expect(cookies).toBeDefined();

        const res = await request(app)
            .post('/api/bookings/create')
            .set('Cookie', cookies)
            .send({
                blockId: block.id,
                vehiclePlate: 'PAST-01',
                visitorName: 'Marty McFly'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/past dates/i);
    });

    it('should reject inactive resident login', async () => {
        // Set resident to inactive
        await prisma.resident.update({ where: { id: residentId }, data: { isActive: false } });

        const resident = await prisma.resident.findUniqueOrThrow({ where: { id: residentId } });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: resident.email,
                password: 'password123'
            });

        // Expect 403 (Forbidden)
        expect(res.status).toBe(403);
        expect(res.body.error || res.body.message).toMatch(/inactive|forbidden|not allowed/i);
    });
});
