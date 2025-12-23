import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { PrismaClient, DurationType } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret'; // Using the fallback for now to match current state

describe('Security Regression Tests', () => {
    let rogueAdminToken: string;
    let buildingAId: string;
    let buildingBId: string;
    let rogueAdminId: string;
    let residentId: string;
    let spotId: string;
    let blockId: string;
    let unique: string;

    beforeAll(async () => {
        try {
            unique = crypto.randomUUID();

            // 1. Create Buildings
            const buildingA = await prisma.building.create({
                data: {
                    name: `Sec Building A ${unique}`,
                    address: 'Sec St A',
                    totalUnits: 10,
                    platformCommissionRate: 0.1,
                    contactEmail: `sec-a-${unique}@test.com`
                }
            });
            buildingAId = buildingA.id;

            const buildingB = await prisma.building.create({
                data: {
                    name: `Sec Building B ${unique}`,
                    address: 'Sec St B',
                    totalUnits: 10,
                    platformCommissionRate: 0.1,
                    contactEmail: `sec-b-${unique}@test.com`
                }
            });
            buildingBId = buildingB.id;

            // 2. Create Rogue Admin (Building Admin but NO building assigned)
            const rogue = await prisma.user.create({
                data: {
                    email: `rogue-${unique}@test.com`,
                    passwordHash: 'hash',
                    role: 'building_admin',
                    buildingId: null, // VULNERABILITY CONDITION
                    isActive: true
                }
            });
            rogueAdminId = rogue.id;
            rogueAdminToken = jwt.sign({
                userId: rogue.id, // Auth service expects userId
                role: rogue.role,
                buildingId: rogue.buildingId
            }, JWT_SECRET, { expiresIn: '1h' });

            // 3. Create Data (Booking in Building A)
            const spot = await prisma.visitorSpot.create({ data: { buildingId: buildingAId, spotNumber: 'V-1' } });
            spotId = spot.id;

            const past = new Date();
            const block = await prisma.availabilityBlock.create({
                data: {
                    spotId,
                    startDatetime: past,
                    endDatetime: new Date(past.getTime() + 11 * 3600 * 1000),
                    durationType: DurationType.ELEVEN_HOURS,
                    basePriceClp: 5000,
                    status: 'available'
                }
            });
            blockId = block.id;

            const unit = await prisma.unit.create({ data: { buildingId: buildingAId, unitNumber: '101' } });
            const resident = await prisma.resident.create({
                data: { unitId: unit.id, email: `res-sec-${unique}@test.com`, firstName: 'R', lastName: 'D', rut: `${unique.substring(0, 8)}-K`, isVerified: true }
            });
            residentId = resident.id;

            await prisma.booking.create({
                data: {
                    availabilityBlockId: block.id,
                    residentId,
                    vehiclePlate: 'SEC-123',
                    visitorName: ' Secret Visitor',
                    amountClp: 5500,
                    commissionClp: 500,
                    status: 'confirmed',
                    paymentStatus: 'paid',
                    confirmationCode: 'SEC-1'
                }
            });

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
            await prisma.unit.deleteMany({ where: { id: { in: [buildingAId, buildingBId].map(id => id ? id : '') } } }); // Cleanup units just in case
            await prisma.user.deleteMany({ where: { id: rogueAdminId } });
            await prisma.building.deleteMany({ where: { id: { in: [buildingAId, buildingBId] } } });
        } catch (e) {
            console.error('cleanup failed', e);
        } finally {
            await prisma.$disconnect();
        }
    });

    it('vulnerability check: Rogue Building Admin without buildingId should NOT see all bookings', async () => {
        const res = await request(app)
            .get('/api/admin/bookings')
            .set('Authorization', `Bearer ${rogueAdminToken}`);

        // VULNERABLE behavior: status 200 and data > 0
        // FIXED behavior: status 403
        expect(res.status).toBe(403);
    });

});
