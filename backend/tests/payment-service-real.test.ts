
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import crypto from 'crypto';
import { PrismaClient, DurationType } from '@prisma/client';

// 1. Mock MercadoPago BEFORE import of PaymentService
const mockCreatePreference = vi.fn();
const mockGetPayment = vi.fn();
const mockRefundPayment = vi.fn();

vi.mock('mercadopago', () => {
    return {
        MercadoPagoConfig: vi.fn(),
        Preference: vi.fn(function () {
            return { create: mockCreatePreference };
        }),
        Payment: vi.fn(function () {
            return {
                get: mockGetPayment,
                refund: mockRefundPayment
            };
        })
    };
});

// 2. Set Env Var to enable Real Mode - MOVED to beforeAll

// 3. Import Service - Dynamic to ensure Env Var is picked up
// import { PaymentService } from '../src/services/PaymentService.js';

const prisma = new PrismaClient();
let PaymentService: any;

describe('PaymentService (Real Mode Integration)', () => {
    let buildingId: string;
    let spotId: string;
    let blockId: string;
    let residentId: string;
    let bookingId: string;
    let unique: string;

    beforeAll(async () => {
        // SET ENV VAR BEFORE IMPORT
        process.env.MP_ACCESS_TOKEN = 'test-token-123';
        const module = await import('../src/services/PaymentService.js');
        PaymentService = module.PaymentService;

        unique = crypto.randomUUID();
        // Setup Building & Dependencies
        const building = await prisma.building.create({
            data: {
                name: `PayReal Build ${unique}`,
                address: 'Real St',
                totalUnits: 5,
                contactEmail: `real-${unique}@test.com`
            }
        });
        buildingId = building.id;

        const spot = await prisma.visitorSpot.create({ data: { buildingId, spotNumber: 'V-REAL' } });
        spotId = spot.id;

        const unit = await prisma.unit.create({ data: { buildingId, unitNumber: '202' } });
        const resident = await prisma.resident.create({
            data: {
                unitId: unit.id,
                email: `real-res-${unique}@test.com`,
                firstName: 'Real',
                lastName: 'User',
                rut: `${unique.substring(0, 8)}-K`,
                isVerified: true,
                passwordHash: 'hash'
            }
        });
        residentId = resident.id;

        const start = new Date();
        start.setHours(start.getHours() + 48);
        const end = new Date(start);
        end.setHours(end.getHours() + 4);

        const block = await prisma.availabilityBlock.create({
            data: {
                spotId,
                startDatetime: start,
                endDatetime: end,
                durationType: DurationType.ELEVEN_HOURS,
                basePriceClp: 20000,
                status: 'available'
            }
        });
        blockId = block.id;
    });

    afterAll(async () => {
        // Cleanup
        try {
            await prisma.payment.deleteMany({ where: { booking: { residentId } } }).catch(() => { });
            await prisma.booking.deleteMany({ where: { residentId } }).catch(() => { });
            await prisma.availabilityBlock.delete({ where: { id: blockId } }).catch(() => { });
            await prisma.visitorSpot.delete({ where: { id: spotId } }).catch(() => { });
            await prisma.resident.deleteMany({ where: { email: { contains: `real-res-${unique}` } } });
            await prisma.unit.deleteMany({ where: { buildingId } });
            await prisma.building.delete({ where: { id: buildingId } });
        } catch (e) {
            console.error('Cleanup error', e);
        }
        await prisma.$disconnect();
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create preference in Real Mode', async () => {
        // Create Booking
        const booking = await prisma.booking.create({
            data: {
                availabilityBlockId: blockId,
                residentId: residentId,
                vehiclePlate: 'REAL-1',
                visitorName: 'Real Payer',
                commissionClp: 2000,
                amountClp: 22000,
                status: 'pending',
                paymentStatus: 'pending',
                confirmationCode: `R-${unique.substring(0, 5)}`
            }
        });
        bookingId = booking.id;

        // Mock MP Response
        mockCreatePreference.mockResolvedValue({
            init_point: 'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=123',
            sandbox_init_point: 'https://sandbox.mercadopago.cl/...'
        });

        // Call Service
        const result = await PaymentService.createPreference(bookingId);

        expect(result.init_point).toBeDefined();
        expect(mockCreatePreference).toHaveBeenCalled(); // Called MP

        // Verify DB Payment created
        const payment = await prisma.payment.findUnique({ where: { bookingId } });
        expect(payment).toBeDefined();
        expect(payment?.status).toBe('pending');
        expect(payment?.amountClp).toBe(22000);
    });

    it('should process Real Webhook (Approved)', async () => {
        // We reuse the bookingId from previous test, which has a payment record 'pending'.

        // Mock MP Get Payment Response
        mockGetPayment.mockResolvedValue({
            id: 999888777,
            status: 'approved',
            status_detail: 'accredited',
            transaction_amount: 22000,
            external_reference: bookingId
        });

        const webhookData = {
            type: 'payment',
            data: { id: '999888777' }
        };

        const result = await PaymentService.processWebhook('payment', webhookData);

        expect(result?.success).toBe(true);
        expect(result?.status).toBe('approved');
        expect(mockGetPayment).toHaveBeenCalledWith({ id: '999888777' });

        // Verify DB
        const payment = await prisma.payment.findUnique({ where: { bookingId } });
        expect(payment?.status).toBe('approved');

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        expect(booking?.status).toBe('confirmed');
        expect(booking?.paymentStatus).toBe('paid');
    });

    it('should refund payment in Real Mode', async () => {
        // Using the approved payment from above

        mockRefundPayment.mockResolvedValue({
            id: 666,
            payment_id: 999888777,
            amount: 22000,
            status: 'approved' // Refund request approved
        });

        const result = await PaymentService.refundPayment(bookingId, 22000);

        expect(result.success).toBe(true);
        expect(result.status).toBe('refunded'); // Service returns 'refunded'
        expect(mockRefundPayment).toHaveBeenCalledWith({
            payment_id: 999888777, // Derived from gatewayResponse or externalPaymentId? 
            // In processWebhook we saved gatewayResponse. The mockGetPayment returns id as number 999888777.
            // PaymentService helper uses id from gatewayResponse.
            body: { amount: 22000 }
        });

        const payment = await prisma.payment.findUnique({ where: { bookingId } });
        expect(payment?.status).toBe('refunded');
    });
});
