
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { subDays, addHours } from 'date-fns'

// Mocks
const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
}
const mockReq = (body: any = {}) => ({
    method: 'POST',
    headers: { authorization: 'Bearer token' },
    body
})

// Mock Modules
const mockTx = {
    availabilityBlock: {
        updateMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findFirst: vi.fn() // I expect to add this call
    },
    booking: {
        create: vi.fn()
    }
}

vi.mock('../lib/db.js', () => ({
    db: {
        $transaction: async (cb: any) => cb(mockTx)
    }
}))

vi.mock('../lib/auth.js', () => ({
    getTokenFromRequest: vi.fn().mockReturnValue('token'),
    // Mock user as resident (buildingId match for IDOR check)
    verifyToken: vi.fn().mockReturnValue({
        role: 'resident',
        userId: 'res1',
        buildingId: 'building-123'
    })
}))

vi.mock('../lib/cors.js', () => ({
    default: vi.fn()
}))

vi.mock('../lib/domain/pricing.js', () => ({
    calculateBookingPricing: vi.fn().mockReturnValue({
        totalAmountClp: 5000,
        commissionClp: 500,
        ownerAmountClp: 4500
    })
}))

import createBookingHandler from '../api/bookings/create.js'

describe('Audit: Business Logic Safety', () => {

    beforeEach(() => {
        vi.clearAllMocks()
        // Default happy path for updateMany (successful lock)
        mockTx.availabilityBlock.updateMany.mockResolvedValue({ count: 1 })
        mockTx.booking.create.mockResolvedValue({ id: 'new-booking' })
    })

    const PAST_BLOCK_ID = '123e4567-e89b-12d3-a456-426614174001'
    const FUTURE_BLOCK_ID = '123e4567-e89b-12d3-a456-426614174002'

    // Valid future dummy block
    const validBlock = {
        id: FUTURE_BLOCK_ID,
        spotId: 'spot-1',
        startDatetime: addHours(new Date(), 24),
        endDatetime: addHours(new Date(), 26),
        basePriceClp: 5000,
        spot: { buildingId: 'building-123' } // Matches user
    }

    it('should REJECT booking a block in the past', async () => {
        const pastDate = subDays(new Date(), 1)

        // Mock findUniqueOrThrow to return a past block
        mockTx.availabilityBlock.findUniqueOrThrow.mockResolvedValue({
            ...validBlock,
            id: PAST_BLOCK_ID,
            startDatetime: pastDate,
            endDatetime: addHours(pastDate, 2)
        })

        await createBookingHandler(mockReq({
            blockId: PAST_BLOCK_ID,
            vehiclePlate: 'PAST01',
            visitorName: 'Marty',
            visitorPhone: '123'
        }) as any, mockRes as any)

        // EXPECTATION: Should fail with specific error
        // Current Code: Likely succeeds (201) or fails on unrelated logic
        if (mockRes.status.mock.calls[0]?.[0] === 201) {
            console.warn('⚠️ SECURITY FAIL: Allowed booking in the past')
        }

        // We assert what we WANT to happen after the fix
        // If this test runs BEFORE valid fix, it might fail (which is good for TDD)
        // Ideally we want to see it turn Green after fix.
        // For "Reproduce" phase, we expect this check to NOT exist, so it should be called with 200/201.

        // Wait, "Reproduction" means proving the bug exists. 
        // So I should assert that it DOES succeed (proving bug) OR assert it FAILS (and see the test fail).
        // Standard practice: Write the test asserting the CORRECT behavior. It will fail. Then fix code. It passes.
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Cannot book past dates' }))
    })

    it('should REJECT overlapping booking if concurrently reserved', async () => {
        // Mock findUniqueOrThrow (Returning the block we want to book)
        mockTx.availabilityBlock.findUniqueOrThrow.mockResolvedValue({
            ...validBlock,
            spot: { buildingId: 'building-123' }
        })

        // Mock findFirst (The overlap check we will add)
        // If we want to simulate an existing overlap, this returns a record.
        mockTx.availabilityBlock.findFirst.mockResolvedValue({
            id: 'other-block-id',
            status: 'reserved'
        })

        await createBookingHandler(mockReq({
            blockId: FUTURE_BLOCK_ID,
            vehiclePlate: 'OVERLAP',
            visitorName: 'Dupe',
            visitorPhone: '123'
        }) as any, mockRes as any)

        // Tests that we actually CALL the overlap check
        // expect(mockTx.availabilityBlock.findFirst).toHaveBeenCalled() // Can't assert this yet as code doesn't exist

        // Assert correct failure
        expect(mockRes.status).toHaveBeenCalledWith(409)
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Double Booking Detected' }))
    })
})
