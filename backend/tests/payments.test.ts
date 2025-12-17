import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { PrismaClient, DurationType } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

describe('Payments API Integration Tests', () => {
    let buildingId: string;
    let spotId: string;
    let blockId: string;
    let residentId: string;
    let bookingId: string;
    let unique: string;

    beforeAll(async () => {
        try {
            unique = crypto.randomUUID();
            const building = await prisma.building.create({
                data: {
                    name: `Payment Building ${unique}`,
                    address: 'Pay St',
                    totalUnits: 5,
                    platformCommissionRate: 0.1,
                    contactEmail: `pay-${unique}@test.com`
                }
            });
            buildingId = building.id;

            const spot = await prisma.visitorSpot.create({ data: { buildingId, spotNumber: 'V-PAY' } });
            spotId = spot.id;

            const unit = await prisma.unit.create({ data: { buildingId, unitNumber: '101' } });
            const resident = await prisma.resident.create({
                data: {
                    unitId: unit.id,
                    email: `pay-res-${unique}@test.com`,
                    firstName: 'P',
                    lastName: 'M',
                    rut: `${unique.substring(0, 8)}-P`,
                    isVerified: true,
                    passwordHash: 'hash'
                }
            });
            residentId = resident.id;

            // Create a Block
            const start = new Date();
            start.setHours(start.getHours() + 24); // Future
            const end = new Date(start);
            end.setHours(end.getHours() + 4);

            const block = await prisma.availabilityBlock.create({
                data: {
                    spotId,
                    startDatetime: start,
                    endDatetime: end,
                    durationType: DurationType.ELEVEN_HOURS,
                    basePriceClp: 10000,
                    status: 'available'
                }
            });
            blockId = block.id;

            // Create a Pending Booking
            const booking = await prisma.booking.create({
                data: {
                    availabilityBlockId: blockId,
                    residentId: residentId,
                    vehiclePlate: 'PAY-123',
                    visitorName: 'Payer One',
                    commissionClp: 1000,
                    amountClp: 11000,
                    status: 'pending',
                    paymentStatus: 'pending',
                    confirmationCode: 'PAY-CODE-1'
                }
            });
            bookingId = booking.id;

        } catch (e) {
            console.error('SETUP FAILED:', e);
            throw e;
        }
    });

    afterAll(async () => {
        try {
            // Delete payments logic if cascading doesn't handle it
            await prisma.payment.deleteMany({ where: { bookingId } });
            if (bookingId) await prisma.booking.delete({ where: { id: bookingId } });
            if (blockId) await prisma.availabilityBlock.delete({ where: { id: blockId } });
            if (residentId) await prisma.resident.deleteMany({ where: { email: { contains: `pay-res-${unique}` } } });
            if (spotId) await prisma.visitorSpot.delete({ where: { id: spotId } });
            if (buildingId) await prisma.building.deleteMany({ where: { name: `Payment Building ${unique}` } }); // Cascade delete units? No, need to be careful.
            // Simplified cleanup for typical cascade:
            // Building -> Units -> Residents 
            // Building -> Spots -> Blocks -> Bookings
            // But Prisma setup might restrict cascade.
            // Explicit delete above is safer.
        } catch (e) {
            console.error('cleanup failed', e);
        } finally {
            await prisma.$disconnect();
        }
    });

    it('should initiate checkout and return simulator URL (Mock Mode)', async () => {
        const res = await request(app)
            .post('/api/payments/checkout')
            .send({ bookingId });

        expect(res.status).toBe(200);
        expect(res.body.init_point).toMatch(/localhost:5173\/payment-simulator/);

        // Verify Payment record created as 'pending'
        const payment = await prisma.payment.findUnique({ where: { bookingId } });
        expect(payment).toBeDefined();
        expect(payment?.status).toBe('pending');
        expect(payment?.amountClp).toBe(11000);
    });

    it('should fail checkout if booking not found', async () => {
        const res = await request(app)
            .post('/api/payments/checkout')
            .send({ bookingId: crypto.randomUUID() });

        expect(res.status).toBe(404);
    });

    it('should process Simulator Webhook (Approved)', async () => {
        const webhookPayload = {
            type: 'simulator',
            data: {
                bookingId: bookingId,
                status: 'approved'
            }
        };

        const res = await request(app)
            .post('/api/payments/webhook')
            .send(webhookPayload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify Booking is confirmed
        const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
        expect(updatedBooking?.status).toBe('confirmed');
        expect(updatedBooking?.paymentStatus).toBe('paid');

        // Verify Payment record updated
        const payment = await prisma.payment.findUnique({ where: { bookingId } });
        expect(payment?.status).toBe('approved');
        expect(payment?.gatewayResponse).toMatchObject({ simulator: true });
    });

    it('should process Simulator Webhook (Rejected)', async () => {
        // Create another booking for rejection test
        const unique2 = crypto.randomUUID();
        const booking2 = await prisma.booking.create({
            data: {
                availabilityBlockId: blockId, // Reusing block (technically overlap if confirmed, but we keep pending/rejected)
                residentId: residentId,
                vehiclePlate: 'REJECT-1',
                visitorName: 'Reject Me',
                commissionClp: 500,
                amountClp: 5500,
                status: 'pending',
                paymentStatus: 'pending',
                confirmationCode: 'REJ-CODE-1'
            }
        });

        const webhookPayload = {
            type: 'simulator',
            data: {
                bookingId: booking2.id,
                status: 'rejected'
            }
        };

        const res = await request(app)
            .post('/api/payments/webhook')
            .send(webhookPayload);

        expect(res.status).toBe(200);

        // Verify Booking remains pending (or whatever logic defined)
        const updatedBooking2 = await prisma.booking.findUnique({ where: { id: booking2.id } });
        expect(updatedBooking2?.status).toBe('pending');

        // Verify Payment record
        const payment = await prisma.payment.findUnique({ where: { bookingId: booking2.id } });
        expect(payment?.status).toBe('rejected');

        // Cleanup
        await prisma.payment.deleteMany({ where: { bookingId: booking2.id } });
        await prisma.booking.delete({ where: { id: booking2.id } });
    });
});
