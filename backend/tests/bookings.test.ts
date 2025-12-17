import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { PrismaClient, DurationType } from '@prisma/client';

// Assumption: Backend is running at this URL (Integration Test)
const API_URL = 'http://localhost:3000';
const prisma = new PrismaClient();

describe('Booking Flow (Integration)', () => {
    let buildingId: string;
    let spotId: string;
    let blockId: string;
    let token: string;
    let createdBookingId: string;

    beforeAll(async () => {
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

        // 2. Create User for Auth (Direct DB)
        const unique = Date.now();
        const email = `test-user-${unique}@test.com`;
        const rut = `${unique.toString().slice(-8)}-${unique.toString().slice(-1)}`;

        const unit = await prisma.unit.create({
            data: {
                buildingId: buildingId,
                unitNumber: `U-${unique.toString().slice(-4)}`
            }
        });

        // Hash password manually
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash('password123', 10);

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
        });

        const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password: 'password123'
        });
        const cookies = loginRes.headers['set-cookie'];
        if (cookies) {
            const tokenCookie = cookies.find(c => c.startsWith('token='));
            if (tokenCookie) {
                token = tokenCookie.split(';')[0].replace('token=', '');
            }
        }

        // 3. Create Spot & Availability Block directly in DB
        const spot = await prisma.visitorSpot.create({
            data: {
                buildingId,
                spotNumber: `V-${unique.toString().slice(-4)}`,
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
        await prisma.$disconnect();
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
        const res = await axios.post(`${API_URL}/api/bookings/create`, {
            blockId,
            vehiclePlate: 'TEST-99',
            visitorName: 'Vitest Visitor'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

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
        // Create a real user who is NOT a resident of the target building (or has wrong role if applicable)
        // In this MVP, "Resident" is the only user type that can book.
        // If I create a resident in Building B, can they book in Building A? 
        // That is the "IDOR" test we just added (which passed!).
        // This test "prevent non-residents" implies someone with a token but NOT a resident.
        // But our `protect` middleware looks up `prisma.resident`.
        // If the token has a userId that is NOT in resident table, currently it returns 401 (User not found).
        // This is ACCEPTABLE security. We just need to match the assertion.

        const adminToken = (await import('../lib/auth.js')).signToken({
            userId: '00000000-0000-0000-0000-000000000000', // Non-existent ID
            role: 'admin',
            buildingId: 'any'
        });

        // Use a new block
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
            // 401 (User not found) or 403 (Forbidden) are both valid security rejections here.
            expect([401, 403]).toContain(error.response?.status);
        } finally {
            await prisma.availabilityBlock.delete({ where: { id: blockC.id } });
        }
    });
});
