import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { PrismaClient, DurationType } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

describe('Spot Search API Integration Tests', () => {
    let buildingId: string;
    let otherBuildingId: string;
    let spotId: string;
    let unique: string;

    beforeAll(async () => {
        try {
            unique = crypto.randomUUID();

            // 1. Create Main Building
            const building = await prisma.building.create({
                data: {
                    name: `Search Building ${unique}`,
                    address: 'Search St',
                    totalUnits: 10,
                    contactEmail: `search-${unique}@test.com`
                }
            });
            buildingId = building.id;

            // 2. Create Other Building (for isolation test)
            const otherBuilding = await prisma.building.create({
                data: {
                    name: `Other Building ${unique}`,
                    address: 'Other St',
                    totalUnits: 5,
                    contactEmail: `other-${unique}@test.com`
                }
            });
            otherBuildingId = otherBuilding.id;

            // 3. Create Spot in Main Building
            const spot = await prisma.visitorSpot.create({
                data: { buildingId, spotNumber: 'V-SEARCH' }
            });
            spotId = spot.id;

            // 4. Create Availability Blocks
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Block 1: Today, 11h
            await prisma.availabilityBlock.create({
                data: {
                    spotId,
                    startDatetime: today,
                    endDatetime: new Date(today.getTime() + 11 * 3600 * 1000),
                    durationType: DurationType.ELEVEN_HOURS,
                    basePriceClp: 5000,
                    status: 'available'
                }
            });

            // Block 2: Tomorrow, 23h
            await prisma.availabilityBlock.create({
                data: {
                    spotId,
                    startDatetime: tomorrow,
                    endDatetime: new Date(tomorrow.getTime() + 23 * 3600 * 1000),
                    durationType: DurationType.TWENTY_THREE_HOURS,
                    basePriceClp: 10000,
                    status: 'available'
                }
            });

        } catch (e) {
            console.error('SETUP FAILED:', e);
            throw e;
        }
    });

    afterAll(async () => {
        try {
            await prisma.availabilityBlock.deleteMany({ where: { spot: { buildingId: { in: [buildingId, otherBuildingId] } } } });
            await prisma.visitorSpot.deleteMany({ where: { buildingId: { in: [buildingId, otherBuildingId] } } });
            await prisma.building.deleteMany({ where: { id: { in: [buildingId, otherBuildingId] } } });
        } catch (e) {
            console.error('cleanup failed', e);
        } finally {
            await prisma.$disconnect();
        }
    });

    it('should return blocks for a valid building', async () => {
        const res = await request(app)
            .get('/api/spots/search')
            .query({ buildingId });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty list for building with no spots', async () => {
        const res = await request(app)
            .get('/api/spots/search')
            .query({ buildingId: otherBuildingId });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
    });

    it('should filter by duration (11h)', async () => {
        const res = await request(app)
            .get('/api/spots/search')
            .query({ buildingId, durationType: '11h' });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        res.body.data.forEach((block: any) => {
            expect(block.durationType).toBe('ELEVEN_HOURS'); // Prisma returns enum key
        });
    });

    it('should filter by specific date (Today)', async () => {
        // Need to format date as YYYY-MM-DD
        const todayStr = new Date().toISOString().split('T')[0];

        const res = await request(app)
            .get('/api/spots/search')
            .query({ buildingId, date: todayStr });

        expect(res.status).toBe(200);
        // Should find at least the "Today" block
        // Might fail if run near midnight? Logic uses TZ America/Santiago.
        // Assuming test env matches or logic handles it.
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should fail with 400 if buildingId is missing', async () => {
        const res = await request(app)
            .get('/api/spots/search'); // No query

        expect(res.status).toBe(400); // Zod error
    });
});
