
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { BookingService } from '../../src/services/BookingService.js';
import { db, ActorType } from '../../src/lib/db.js';
import { PaymentService } from '../../src/services/PaymentService.js';
import { AppError } from '../../src/lib/errors.js';
import crypto from 'crypto';

// Manual Mock for EventBus to avoid singleton issues
const { mockPublish } = vi.hoisted(() => {
    return { mockPublish: vi.fn() };
});

vi.mock('../../src/lib/event-bus.js', () => ({
    EventBus: {
        getInstance: vi.fn().mockReturnValue({
            publish: mockPublish
        })
    },
    EventType: {
        BOOKING_CREATED: 'BOOKING_CREATED',
        SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
        BOOKING_CANCELLED: 'BOOKING_CANCELLED'
    }
}));

// Mock Dependencies
vi.mock('../../src/lib/db.js', () => ({
    db: mockDeep(),
    ActorType: { HUMAN: 'HUMAN', SYSTEM: 'SYSTEM' }
}));

vi.mock('../../src/services/PaymentService.js');

describe('BookingService Unit Tests', () => {
    const dbMock = db as unknown as DeepMockProxy<typeof db>;

    // Generate valid UUID for validation tests
    const validUUID = crypto.randomUUID();

    beforeEach(() => {
        mockReset(dbMock);
        vi.clearAllMocks(); // Clears mockPublish history too

        // Default valid resident
        dbMock.resident.findUnique.mockResolvedValue({
            id: 'res-1',
            email: 'test@test.com',
            rutHash: 'hash-1',
            unit: { buildingId: 'bld-1' }
        } as any);

        // Default no blacklist
        dbMock.blocklist.findMany.mockResolvedValue([]);
    });

    describe('createBooking', () => {
        it('should successfully create a booking', async () => {
            const mockPayload = {
                blockId: validUUID,
                vehiclePlate: 'TEST-12',
                visitorName: 'John Doe',
                visitorPhone: '+56912345678'
            };
            const mockUser = { userId: 'res-1', role: 'resident', buildingId: 'bld-1' };
            const mockMeta = { ip: '1.1.1.1', userAgent: 'T', country: 'CL' };

            // Setup Transaction Mock
            dbMock.$transaction.mockImplementation(async (cb) => cb(dbMock));

            // Mock Availability Transaction Flow
            dbMock.availabilityBlock.findUniqueOrThrow.mockResolvedValueOnce({ spotId: 'spot-1' } as any); // Pre-fetch
            dbMock.visitorSpot.update.mockResolvedValue({} as any); // Lock
            dbMock.availabilityBlock.updateMany.mockResolvedValue({ count: 1 }); // Atomic Update

            // Mock Block Details
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);

            dbMock.availabilityBlock.findUniqueOrThrow.mockResolvedValue({
                id: validUUID,
                startDatetime: futureDate,
                endDatetime: new Date(futureDate.getTime() + 3600000),
                spot: { buildingId: 'bld-1', building: { platformCommissionRate: 0.1 } },
                basePriceClp: 10000,
                spotId: 'spot-1'
            } as any);

            // Mock No Double Booking
            dbMock.availabilityBlock.findFirst.mockResolvedValue(null);

            // Mock Pricing Rules (None)
            dbMock.pricingRule.findMany.mockResolvedValue([]);

            // Mock Booking Creation
            const mockBooking = { id: 'booking-1', amountClp: 11000 };
            dbMock.booking.create.mockResolvedValue(mockBooking as any);

            // Mock Payment Service
            (PaymentService.createPreference as any).mockResolvedValue({ init_point: 'url' });

            const result = await BookingService.createBooking(mockUser, mockPayload, mockMeta);

            expect(result.booking).toEqual(mockBooking);
            expect(result.payment.init_point).toBe('url');
            expect(dbMock.booking.create).toHaveBeenCalled();
            expect(mockPublish).toHaveBeenCalled();
        });

        it('should throw validation error for invalid input', async () => {
            const mockUser = { userId: 'res-1', role: 'resident', buildingId: 'bld-1' };
            const mockMeta = { ip: '1.1.1.1', userAgent: 'T', country: 'CL' };
            const invalidPayload = {
                blockId: validUUID,
                vehiclePlate: 'A', // Too short
                visitorName: 'John Doe'
            };
            await expect(BookingService.createBooking(mockUser, invalidPayload, mockMeta))
                .rejects.toThrow();
        });

        it('should block blacklisted users', async () => {
            const mockUser = { userId: 'res-1', role: 'resident', buildingId: 'bld-1' };
            const mockMeta = { ip: '1.1.1.1', userAgent: 'T', country: 'CL' };
            // Using same payload
            const mockPayload = {
                blockId: validUUID,
                vehiclePlate: 'TEST-12',
                visitorName: 'John Doe',
                visitorPhone: '+56912345678'
            };

            dbMock.blocklist.findMany.mockResolvedValue([{ reason: 'Bad behavior' }] as any);

            // Match internal message 'Bad behavior'
            await expect(BookingService.createBooking(mockUser, mockPayload, mockMeta))
                .rejects.toThrow(/Bad behavior/);
        });

        it('should rollback if payment init fails', async () => {
            const mockUser = { userId: 'res-1', role: 'resident', buildingId: 'bld-1' };
            const mockMeta = { ip: '1.1.1.1', userAgent: 'T', country: 'CL' };
            const mockPayload = {
                blockId: validUUID,
                vehiclePlate: 'TEST-12',
                visitorName: 'John Doe',
                visitorPhone: '+56912345678'
            };

            dbMock.$transaction.mockImplementation(async (cb) => cb(dbMock));
            dbMock.availabilityBlock.findUniqueOrThrow.mockResolvedValueOnce({ spotId: 'spot-1' } as any);
            dbMock.visitorSpot.update.mockResolvedValue({} as any);
            dbMock.availabilityBlock.updateMany.mockResolvedValue({ count: 1 });

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            dbMock.availabilityBlock.findUniqueOrThrow.mockResolvedValue({
                id: validUUID,
                startDatetime: futureDate,
                endDatetime: new Date(futureDate.getTime() + 3600000),
                spot: { buildingId: 'bld-1', building: { platformCommissionRate: 0.1 } },
                basePriceClp: 10000
            } as any);

            dbMock.availabilityBlock.findFirst.mockResolvedValue(null);
            dbMock.pricingRule.findMany.mockResolvedValue([]);
            const mockBooking = { id: 'booking-1', amountClp: 11000, residentId: 'res-1' };
            dbMock.booking.create.mockResolvedValue(mockBooking as any);

            // Payment Fails
            (PaymentService.createPreference as any).mockRejectedValue(new Error('MP Down'));

            const cancelSpy = vi.spyOn(BookingService, 'cancelBooking').mockResolvedValue({} as any);

            try {
                // We expect it to throw. Use strict match if regex fails.
                await expect(BookingService.createBooking(mockUser, mockPayload, mockMeta))
                    .rejects.toThrow();

                expect(cancelSpy).toHaveBeenCalledWith('booking-1', 'res-1', 'system-rollback');
            } finally {
                cancelSpy.mockRestore(); // Restore logic for subsequent tests
            }
        });
    });

    describe('cancelBooking', () => {
        it('should calculate 90% refund for >24h notice', async () => {
            const future = new Date();
            future.setDate(future.getDate() + 2); // 48h

            dbMock.booking.findUnique.mockResolvedValue({
                id: 'booking-1',
                residentId: 'res-1',
                status: 'confirmed',
                paymentStatus: 'paid',
                amountClp: 10000,
                availabilityBlock: { startDatetime: future },
                availabilityBlockId: 'block-1'
            } as any);

            dbMock.$transaction.mockImplementation(async (cb) => cb(dbMock));
            dbMock.booking.update.mockResolvedValue({} as any);
            dbMock.availabilityBlock.update.mockResolvedValue({} as any);

            const result = await BookingService.cancelBooking('booking-1', 'res-1', 'resident') as any;

            expect(result.refundAmount).toBe(9000); // 90%
            expect(PaymentService.refundPayment).toHaveBeenCalledWith('booking-1', 9000);
        });

        it('should calculate 0% refund for <24h notice', async () => {
            const soon = new Date();
            soon.setHours(soon.getHours() + 12); // 12h

            dbMock.booking.findUnique.mockResolvedValue({
                id: 'booking-1',
                residentId: 'res-1',
                status: 'confirmed',
                paymentStatus: 'paid',
                amountClp: 10000,
                availabilityBlock: { startDatetime: soon },
                availabilityBlockId: 'block-1'
            } as any);

            dbMock.$transaction.mockImplementation(async (cb) => cb(dbMock));

            const result = await BookingService.cancelBooking('booking-1', 'res-1', 'resident') as any;

            expect(result.refundAmount).toBe(0);
            expect(PaymentService.refundPayment).not.toHaveBeenCalled();
        });

        it('should calculate 100% refund for Admin Override', async () => {
            const soon = new Date();
            soon.setHours(soon.getHours() + 1); // 1h

            dbMock.booking.findUnique.mockResolvedValue({
                id: 'booking-1',
                residentId: 'res-1',
                status: 'confirmed',
                paymentStatus: 'paid',
                amountClp: 10000,
                availabilityBlock: { startDatetime: soon },
                availabilityBlockId: 'block-1'
            } as any);

            dbMock.$transaction.mockImplementation(async (cb) => cb(dbMock));

            const result = await BookingService.cancelBooking('booking-1', 'admin-id', 'admin') as any;

            expect(result.refundAmount).toBe(10000);
            expect(PaymentService.refundPayment).toHaveBeenCalledWith('booking-1', 10000);
        });
    });
});
