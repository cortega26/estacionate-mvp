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

        // 2. Create User for Auth
        const unique = Date.now();
        const email = `test-user-${unique}@test.com`;
        const rut = `12345678-${unique.toString().slice(-1)}`; // Mock RUT

        // Signup via API to get token simply
        const unit = await prisma.unit.create({
            data: {
                buildingId: buildingId,
                unitNumber: `U-${unique.toString().slice(-4)}`
            }
        });

        await axios.post(`${API_URL}/api/auth/signup`, {
            email,
            password: 'password123',
            rut,
            firstName: 'Test',
            lastName: 'User',
            buildingId: buildingId,
            unitNumber: unit.unitNumber
        });

        const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password: 'password123'
        });
        token = loginRes.data.accessToken;

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
});
