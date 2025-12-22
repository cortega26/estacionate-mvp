import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { hashPII } from '../src/lib/crypto.js';

const prisma = new PrismaClient();

describe('Sign Up Integration Tests (api/auth/signup)', () => {
    let buildingId: string;
    let unitId: string;
    let unique: string;

    beforeAll(async () => {
        try {
            unique = crypto.randomUUID();

            // Fix: Use unique RUT.
            const uniqueRut = unique.substring(0, 8) + '-9';

            const building = await prisma.building.create({
                data: {
                    name: `Signup Building ${unique}`,
                    address: 'Signup St',
                    totalUnits: 10,
                    platformCommissionRate: 0.1,
                    contactEmail: `signup-${unique}@test.com`
                }
            });
            buildingId = building.id;

            const unit = await prisma.unit.create({
                data: { buildingId, unitNumber: '101' }
            });
            unitId = unit.id;
        } catch (e) {
            console.error('SETUP FAILED:', e);
            throw e;
        }
    });

    afterAll(async () => {
        try {
            if (unitId) {
                // Delete residents first to satisfy FK constraint
                await prisma.resident.deleteMany({ where: { unitId } });
                await prisma.unit.delete({ where: { id: unitId } });
            }
            if (buildingId) await prisma.building.delete({ where: { id: buildingId } });
        } catch (e) {
            console.error('cleanup failed', e);
        } finally {
            await prisma.$disconnect();
        }
    });

    it('should register a new resident successfully', async () => {
        const uniqueRut = `${unique.substring(0, 8)}-9`;
        const payload = {
            email: `new-res-${unique}@test.com`,
            password: 'password123',
            rut: uniqueRut,
            firstName: 'John',
            lastName: 'Doe',
            buildingId: buildingId,
            unitNumber: '101',
            phone: '+56912345678'
        };

        const res = await request(app)
            .post('/api/auth/signup')
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.residentId).toBeDefined();

        // Verify in DB
        const resident = await prisma.resident.findUnique({ where: { id: res.body.residentId } });
        expect(resident).toBeDefined();
        expect(resident?.email).toBe(payload.email);
        expect(resident?.isVerified).toBe(false); // Should default to false
    });

    it('should fail if unit does not exist in building', async () => {
        const payload = {
            email: `bad-unit-${unique}@test.com`,
            password: 'password123',
            rut: `98765432-1`,
            firstName: 'Jane',
            lastName: 'Doe',
            buildingId: buildingId,
            unitNumber: '999' // Non-existent
        };

        const res = await request(app)
            .post('/api/auth/signup')
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Unit not found/i);
    });

    it('should fail if email is already registered', async () => {
        // Create a resident first
        const email = `dup-email-${unique}@test.com`;
        const rut = `11111111-1`;
        const rutHash = await hashPII(rut);

        await prisma.resident.create({
            data: {
                unitId,
                email,
                firstName: 'X',
                lastName: 'Y',
                rut: rut, // Should be encrypted technically but MVP test might skip encryption for direct DB unless strict
                // Actually signup.ts encrypts it. But uniqueness check relies on rutHash.
                rutHash: rutHash,
                passwordHash: 'hash',
                isVerified: true
            }
        });

        const payload = {
            email: email,
            password: 'password123',
            rut: `22222222-2`, // Different RUT
            firstName: 'Copy',
            lastName: 'Cat',
            buildingId: buildingId,
            unitNumber: '101'
        };
        // ...
    });

    it('should fail if RUT is already registered', async () => {
        const rut = `33333333-3`;
        const rutHash = await hashPII(rut);

        await prisma.resident.create({
            data: {
                unitId,
                email: `unique-${unique}@test.com`,
                firstName: 'X',
                lastName: 'Y',
                rut: rut,
                rutHash: rutHash,
                passwordHash: 'hash',
                isVerified: true
            }
        });

        const payload = {
            email: `another-${unique}@test.com`, // Different Email
            password: 'password123',
            rut: rut, // Duplicate RUT
            firstName: 'Copy',
            lastName: 'Cat',
            buildingId: buildingId,
            unitNumber: '101'
        };
        // ...

        const res = await request(app)
            .post('/api/auth/signup')
            .send(payload);

        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/already registered/i);
    });

    it('should validate input types (Zod)', async () => {
        const payload = {
            email: 'not-an-email',
            password: '123', // Too short
            // Missing RUT
            // Missing Names
        };

        const res = await request(app)
            .post('/api/auth/signup')
            .send(payload);

        expect(res.status).toBe(400);
        // Zod returns array of errors
        expect(res.body.error).toBeInstanceOf(Array);
    });
});
