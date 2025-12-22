import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import axios from 'axios';
import { PrismaClient, DurationType } from '@prisma/client';
import crypto from 'crypto';
import type { Server } from 'http';

// Mock Redis to prevent connection errors during tests
vi.mock('../src/lib/redis.js', () => ({
    redis: {
        status: 'ready',
        incr: vi.fn().mockResolvedValue(1),
        expire: vi.fn().mockResolvedValue(1),
        on: vi.fn(),
    }
}));

import { app } from '../app.js';

// Assumption: Backend is running at this URL (Integration Test)
let API_URL = 'http://127.0.0.1:3000';
const prisma = new PrismaClient();
let server: Server;

describe('Booking Flow (Integration)', () => {
    let buildingId: string;
    let spotId: string;
    let blockId: string;
    let token: string;
    let createdBookingId: string;
    let userId: string;
    let unitId: string;

    beforeAll(async () => {
        // Start Server
        await new Promise<void>((resolve) => {
            server = app.listen(0, '127.0.0.1', () => {
                const addr = server.address();
                API_URL = 'http://127.0.0.1:' + (addr as any).port;
                console.log('Test Server running at ' + API_URL);
                resolve();
            });
        });

        try {
            // 1. Setup Building & Resident
            const building = await prisma.building.findFirst();
            if (!building) {
                // Seed if empty (basic fallback)
                const newBuilding = await prisma.building.create({
                    data: {
                        name: 'Test Building',
                        address: '123 Test St',
                        contactEmail: 'test@building.com',
                        totalUnits: 10,
                        timezone: 'America/Santiago'
                    }
                });
                buildingId = newBuilding.id;
            } else {
                buildingId = building.id;
            }



            // 2. Create User for Auth
            const unique = crypto.randomUUID();
            // Simplify email
            const email = `vitest-${unique}@test.com`;
            console.log('Attempting request with email:', email);
            const rut = `${unique.substring(0, 8)}-K`;

            const unit = await prisma.unit.create({
                data: {
                    buildingId: buildingId,
                    unitNumber: `U-${unique.substring(0, 5)}`
                }
            });
            unitId = unit.id;

            // Hash password using service to ensure consistency
            const { hashPassword } = await import('../src/services/auth.js');
            const passwordHash = await hashPassword('password123');

            await prisma.resident.create({
                data: {
                    email,
                    passwordHash,
                    rut,
                    firstName: 'Test',
                    lastName: 'User',
                    unitId: unit.id,
                    isVerified: true // Directly verified
                }
            }).then(r => userId = r.id);

            const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password: 'password123'
            }); // Revert validateStatus

            if (loginRes.status !== 200) {
                console.error('LOGIN FAILED:', loginRes.status, loginRes.data);
            }

            const cookies = loginRes.headers['set-cookie'];
            if (cookies) {
                const tokenCookie = cookies.find((c: any) => c.startsWith('token='));
                if (tokenCookie) {
                    token = tokenCookie.split(';')[0].replace('token=', '');
                }
            }

            if (!token) {
                throw new Error(`DEBUG: Token missing. Login Status: ${loginRes.status}. Headers: ${JSON.stringify(loginRes.headers)}`);
            }

            // 3. Create Spot & Availability Block directly in DB
            const spot = await prisma.visitorSpot.create({
                data: {
                    buildingId,
                    spotNumber: `V-${unique.substring(0, 5)}`,
                    isActive: true
                }
            });
            spotId = spot.id;

            const start = new Date();
            start.setDate(start.getDate() + 1); // Tomorrow
            start.setHours(10, 0, 0, 0);
            const end = new Date(start);
            end.setHours(21, 0, 0, 0); // 11h later

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
        } catch (error: any) {
            console.error('BEFORE ALL FAILED:', error.response?.data || error.message);
            throw error;
        }
    });

    afterAll(async () => {
        // Cleanup
        if (createdBookingId) {
            await prisma.booking.deleteMany({ where: { id: createdBookingId } });
        }
        if (blockId) {
            await prisma.availabilityBlock.deleteMany({ where: { id: blockId } });
        }
        if (spotId) {
            await prisma.visitorSpot.deleteMany({ where: { id: spotId } });
        }
        if (userId) {
            await prisma.resident.deleteMany({ where: { id: userId } });
        }
        if (unitId) {
            await prisma.unit.deleteMany({ where: { id: unitId } });
        }
        // Only delete building if we created it (check if it matches our unique pattern or is the fallback)
        // If we reused "Test Building", deleting it might affect other tests potentially?
        // But for integration tests running sequentially it is safer to leave it if it was pre-existing?
        // Actually, the setup code creates "Test Building" if NOT found.
        // Let's strictly delete what we created if we track it.
        // Since we didn't robustly track "didCreatedBuilding", let's skip deleting building to be safe against breaking other tests,
        // OR we should have created a unique building.
        // Ideally we should have created a unique building every time.
        // For now, cleaning Resident/Unit/Spot is sufficient for repeating THIS test.

        await prisma.$disconnect();
        if (server) server.close();
    });

    it('should find the available spot via search', async () => {
        const res = await axios.get(`${API_URL}/api/spots/search`, {
            params: { buildingId }
        });
        const found = res.data.data.find((b: any) => b.id === blockId);
        expect(found).toBeDefined();
        expect(found.status).toBe('available');
    });

    it('should create a booking successfully', async () => {
        let res;
        try {
            res = await axios.post(`${API_URL}/api/bookings/create`, {
                blockId,
                vehiclePlate: 'TEST-99',
                visitorName: 'Vitest Visitor'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error: any) {
            console.error('CREATE BOOKING FAILED:', error.response?.status, error.response?.data);
            throw error;
        }

        expect(res.status).toBe(201);
        expect(res.data.booking.id).toBeDefined();
        expect(res.data.booking.status).toBe('pending');
        createdBookingId = res.data.booking.id;

        // Verify DB status update
        const block = await prisma.availabilityBlock.findUnique({ where: { id: blockId } });
        expect(block?.status).toBe('reserved');
    });

    it('should prevent double booking (Optimistic Locking)', async () => {
        try {
            await axios.post(`${API_URL}/api/bookings/create`, {
                blockId,
                vehiclePlate: 'FAIL-00',
                visitorName: 'Late Visitor'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Should fail
            expect(true).toBe(false);
        } catch (error: any) {
            // Expect 409 Conflict
            expect(error.response?.status).toBe(409);
            // It could be BLOCK_UNAVAILABLE (Spot no longer available) because status is reserved
            expect(error.response?.data?.error).toMatch(/no longer available|Double Booking/i);
        }
    });

    it('should validate input types', async () => {
        try {
            await axios.post(`${API_URL}/api/bookings/create`, {
                blockId,
                vehiclePlate: 'AT', // Too short
                visitorName: 'Vitest Visitor'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            expect(true).toBe(false); // Guard
        } catch (error: any) {
            expect(error.response?.status).toBe(400);
        }
    });

    it('should prevent booking a different block that overlaps in time', async () => {
        // 1. Create a second block that overlaps with the first one (which is already booked)
        // Original block: Tomorrow 10am - 9pm
        // New block: Tomorrow 12pm - 2pm (Inside the first one)

        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(12, 0, 0, 0);
        const end = new Date(start);
        end.setHours(14, 0, 0, 0);

        const blockB = await prisma.availabilityBlock.create({
            data: {
                spotId,
                startDatetime: start,
                endDatetime: end,
                durationType: DurationType.ELEVEN_HOURS, // Dummy Type
                basePriceClp: 6000,
                status: 'available'
            }
        });

        try {
            await axios.post(`${API_URL}/api/bookings/create`, {
                blockId: blockB.id,
                vehiclePlate: 'OVERLAP',
                visitorName: 'Overlap Visitor'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Should fail
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.response?.status).toBe(409);
            expect(error.response?.data?.error).toMatch(/Double Booking/i);
        } finally {
            await prisma.availabilityBlock.delete({ where: { id: blockB.id } });
        }
    });

    it('should prevent booking in a different building (IDOR protection)', async () => {
        // Create Building B
        const buildingB = await prisma.building.create({
            data: {
                name: 'Building B', address: '456 Other St',
                totalUnits: 10, platformCommissionRate: 0.1, contactEmail: 'b@test.com'
            }
        });
        const spotB = await prisma.visitorSpot.create({ data: { buildingId: buildingB.id, spotNumber: 'V-B' } });

        const start = new Date();
        start.setDate(start.getDate() + 2); // Day after tomorrow

        const blockB = await prisma.availabilityBlock.create({
            data: {
                spotId: spotB.id,
                startDatetime: start,
                endDatetime: new Date(start.getTime() + 3600000),
                durationType: DurationType.ELEVEN_HOURS,
                basePriceClp: 5000,
                status: 'available'
            }
        });

        try {
            await axios.post(`${API_URL}/api/bookings/create`, {
                blockId: blockB.id,
                vehiclePlate: 'IDOR-01',
                visitorName: 'Hacker'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.response?.status).toBe(403);
            expect(error.response?.data?.error).toMatch(/own building/i);
        } finally {
            // Cleanup
            await prisma.availabilityBlock.delete({ where: { id: blockB.id } });
            await prisma.visitorSpot.delete({ where: { id: spotB.id } });
            await prisma.building.delete({ where: { id: buildingB.id } });
        }
    });

    it('should prevent non-residents from booking', async () => {
        const adminToken = (await import('../src/services/auth.js')).signToken({
            userId: '00000000-0000-0000-0000-000000000000',
            role: 'admin',
            buildingId: 'any'
        });

        const start = new Date();
        start.setDate(start.getDate() + 3);

        const blockC = await prisma.availabilityBlock.create({
            data: {
                spotId,
                startDatetime: start,
                endDatetime: new Date(start.getTime() + 3600000),
                durationType: DurationType.ELEVEN_HOURS,
                basePriceClp: 5000,
                status: 'available'
            }
        });

        try {
            await axios.post(`${API_URL}/api/bookings/create`, {
                blockId: blockC.id,
                vehiclePlate: 'ADMIN-00',
                visitorName: 'Admin'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            expect(true).toBe(false);
        } catch (error: any) {
            expect([401, 403]).toContain(error.response?.status);
        } finally {
            await prisma.availabilityBlock.delete({ where: { id: blockC.id } });
        }
    });

});

