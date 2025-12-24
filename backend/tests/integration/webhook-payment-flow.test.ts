
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { PrismaClient, DurationType } from '@prisma/client';
import { app } from '../../app.js';

// 1. Mock MercadoPago Library (External Vendor)
// This ensures that when PaymentService calls Payment.get(), it gets our controlled response.
// We DO NOT mock PaymentService itself.
const mockGetPayment = vi.fn();

vi.mock('mercadopago', () => {
    return {
        MercadoPagoConfig: vi.fn(),
        Payment: vi.fn(function () {
            return {
                get: mockGetPayment,
            };
        }),
        Preference: vi.fn(function () {
            return {
                create: vi.fn().mockResolvedValue({ init_point: 'http://mock.mp' })
            };
        })
    };
});

// Initialize Prisma
const prisma = new PrismaClient();

describe('Webhook -> Payment -> DB Integration', () => {
    const MOCK_SECRET = 'integration-secret-999';
    let buildingId: string;
    let spotId: string;
    let blockId: string;
    let bookingId: string;
    let unique: string;
    let residentId: string;

    const originalEnv = process.env;

    beforeAll(async () => {
        // Setup Environment
        vi.resetModules();
        process.env = {
            ...originalEnv,
            MP_WEBHOOK_SECRET: MOCK_SECRET,
            MP_ACCESS_TOKEN: 'test-token'
        };

        // Setup DB Data
        unique = crypto.randomUUID();

        // 1. Create Building
        const building = await prisma.building.create({
            data: {
                name: `Webhook Integ ${unique}`,
                address: 'Integration St',
                totalUnits: 10,
                contactEmail: `integ-${unique}@test.com`
            }
        });
        buildingId = building.id;

        // 2. Create Spot
        const spot = await prisma.visitorSpot.create({
            data: { buildingId, spotNumber: 'V-INT' }
        });
        spotId = spot.id;

        // 3. Create Unit & Resident
        const unit = await prisma.unit.create({ data: { buildingId, unitNumber: '101' } });
        const resident = await prisma.resident.create({
            data: {
                unitId: unit.id,
                email: `integ-res-${unique}@test.com`,
                firstName: 'Integ',
                lastName: 'User',
                rut: `${unique.substring(0, 8)}-K`,
                isVerified: true,
                passwordHash: 'hash'
            }
        });
        residentId = resident.id;

        // 4. Create Availability Block
        const start = new Date();
        start.setDate(start.getDate() + 1); // Tomorrow
        const end = new Date(start);
        end.setHours(end.getHours() + 4);

        const block = await prisma.availabilityBlock.create({
            data: {
                spotId,
                startDatetime: start,
                endDatetime: end,
                durationType: DurationType.ELEVEN_HOURS,
                basePriceClp: 10000,
                status: 'reserved' // Assume it's reserved pending payment
            }
        });
        blockId = block.id;

        // 5. Create Booking (Pending)
        const booking = await prisma.booking.create({
            data: {
                availabilityBlockId: blockId,
                residentId: residentId,
                vehiclePlate: 'WEB-99',
                visitorName: 'Webhook Tester',
                commissionClp: 1000,
                amountClp: 11000,
                status: 'pending',
                paymentStatus: 'pending',
                confirmationCode: `W-${unique.substring(0, 5)}`
            }
        });
        bookingId = booking.id;

        // 6. Create Initial Payment Record
        await prisma.payment.create({
            data: {
                bookingId,
                amountClp: 11000,
                status: 'pending'
            }
        });
    });

    afterAll(async () => {
        // Restore Env
        process.env = originalEnv;

        // Cleanup DB
        try {
            await prisma.payment.deleteMany({ where: { bookingId } });
            await prisma.booking.deleteMany({ where: { id: bookingId } });
            await prisma.availabilityBlock.delete({ where: { id: blockId } });
            await prisma.visitorSpot.delete({ where: { id: spotId } });
            await prisma.resident.deleteMany({ where: { id: residentId } });
            await prisma.unit.deleteMany({ where: { buildingId } });
            await prisma.building.delete({ where: { id: buildingId } });
        } catch (e) {
            console.error('Cleanup failed', e);
        }
        await prisma.$disconnect();
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should full-cycle: Verify Signature -> Process Logic -> Update DB', async () => {
        const mpPaymentId = '123456789';

        // 1. Setup Mock Response from MP
        mockGetPayment.mockResolvedValue({
            id: Number(mpPaymentId),
            status: 'approved',
            status_detail: 'accredited',
            transaction_amount: 11000,
            external_reference: bookingId
        });

        // 2. Generate Signature
        const requestId = 'req-integ-1';
        const ts = Date.now().toString();
        const manifest = `id:${mpPaymentId};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', MOCK_SECRET);
        const signature = hmac.update(manifest).digest('hex');

        // 3. Send Webhook Request
        const res = await request(app)
            .post('/api/payments/webhook')
            .set('x-signature', `ts=${ts};v1=${signature}`)
            .set('x-request-id', requestId)
            .send({
                type: 'payment',
                data: { id: mpPaymentId }
            });

        // 4. Verify HTTP Response
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.status).toBe('approved');

        // 5. Verify MP was called
        expect(mockGetPayment).toHaveBeenCalledWith({ id: mpPaymentId });

        // 6. KEY: Verify DB Updates (The "Integration" part)
        const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
        expect(updatedBooking?.status).toBe('confirmed');
        expect(updatedBooking?.paymentStatus).toBe('paid');

        const updatedPayment = await prisma.payment.findUnique({ where: { bookingId } });
        expect(updatedPayment?.status).toBe('approved');
        expect(updatedPayment?.externalPaymentId).toBe(mpPaymentId);
    });

    it('should reject invalid signature and NOT touch DB', async () => {
        const mpPaymentId = '999999';

        // 1. Send Invalid Request
        const res = await request(app)
            .post('/api/payments/webhook')
            .set('x-signature', `ts=${Date.now()};v1=bad_sig`)
            .set('x-request-id', 'req-bad')
            .send({
                type: 'payment',
                data: { id: mpPaymentId }
            });

        // 2. Verify Rejection
        expect(res.status).toBe(403);

        // 3. Verify MP NOT called
        expect(mockGetPayment).not.toHaveBeenCalled();
    });
});
