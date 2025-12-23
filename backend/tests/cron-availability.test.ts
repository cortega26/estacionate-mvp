import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import handler from '../src/api/cron/generate-availability.js';
import { db } from '../src/lib/db.js';

const prisma = new PrismaClient();

describe('Availability Generator Cron (Integration)', () => {
    let buildingId: string;
    let spotId: string;

    beforeAll(async () => {
        // Setup Building & Spot
        const building = await prisma.building.create({
            data: {
                name: 'Cron Test Building',
                address: 'Cron St',
                totalUnits: 1,
                contactEmail: 'cron@test.com'
            }
        });
        buildingId = building.id;

        const spot = await prisma.visitorSpot.create({
            data: {
                buildingId,
                spotNumber: 'CRON-01',
                isActive: true
            }
        });
        spotId = spot.id;
    });

    afterAll(async () => {
        await prisma.availabilityBlock.deleteMany({ where: { spotId } });
        await prisma.visitorSpot.delete({ where: { id: spotId } });
        await prisma.building.delete({ where: { id: buildingId } });
        await prisma.$disconnect();
    });

    it('should generate blocks for the next 30 days', async () => {
        const req = { method: 'POST', headers: {} } as any;
        const res = {
            status: (code: number) => ({
                json: (data: any) => ({ code, data })
            })
        } as any;

        const result = await handler(req, res) as any;

        expect(result.code).toBe(200);
        expect(result.data.success).toBe(true);
        // 30 days * 2 slots = 60 blocks per spot
        expect(result.data.created).toBeGreaterThanOrEqual(60);

        // Verify DB
        const count = await prisma.availabilityBlock.count({ where: { spotId } });
        expect(count).toBe(60);
    });

    it('should be idempotent (not create duplicates)', async () => {
        const req = { method: 'POST', headers: {} } as any;
        const res = {
            status: (code: number) => ({
                json: (data: any) => ({ code, data })
            })
        } as any;

        // Run Again
        const result = await handler(req, res) as any;

        expect(result.code).toBe(200);
        expect(result.data.created).toBe(0); // Should be 0
        expect(result.data.skipped).toBeGreaterThanOrEqual(60);

        const count = await prisma.availabilityBlock.count({ where: { spotId } });
        expect(count).toBe(60); // Still 60
    });
});
