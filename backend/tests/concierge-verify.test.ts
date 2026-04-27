import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../src/api/concierge/verify.js'
import { db } from '../src/lib/db.js'
import { getTokenFromRequest, verifyToken } from '../src/services/auth.js'

vi.mock('../src/lib/cors.js', () => ({
    default: vi.fn(async () => undefined),
}))

vi.mock('../src/lib/db.js', () => ({
    db: {
        booking: {
            findFirst: vi.fn(),
        },
    },
}))

vi.mock('../src/services/auth.js', () => ({
    getTokenFromRequest: vi.fn(),
    verifyToken: vi.fn(),
}))

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
    getHeader: vi.fn(),
    end: vi.fn(),
})

describe('Concierge verify API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getTokenFromRequest).mockReturnValue('valid-token')
        vi.mocked(verifyToken).mockReturnValue({
            role: 'concierge',
            userId: 'concierge-1',
            buildingId: 'building-1',
        })
    })

    it('filters verification lookups to the concierge building and active time window', async () => {
        vi.mocked(db.booking.findFirst).mockResolvedValue({
            id: 'booking-1',
            vehiclePlate: 'ABCD12',
            visitorName: 'Visita Demo',
            resident: {
                firstName: 'Demo',
                lastName: 'Resident',
                email: 'resident@estacionate.cl',
            },
            availabilityBlock: {
                endDatetime: new Date('2026-04-26T18:30:00.000Z'),
                spot: {
                    spotNumber: 'B-12',
                },
            },
        } as any)

        const req: any = {
            method: 'POST',
            headers: { origin: 'http://localhost:5173' },
            body: { plate: 'ABCD12' },
        }
        const res: any = createResponse()

        await handler(req, res)

        expect(db.booking.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    vehiclePlate: { equals: 'ABCD12', mode: 'insensitive' },
                    status: 'confirmed',
                    availabilityBlock: expect.objectContaining({
                        spot: { buildingId: 'building-1' },
                        startDatetime: { lte: expect.any(Date) },
                        endDatetime: { gte: expect.any(Date) },
                    }),
                }),
            })
        )
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('rejects bookings outside the active window or assigned building', async () => {
        vi.mocked(db.booking.findFirst).mockResolvedValue(null)

        const req: any = {
            method: 'POST',
            headers: { origin: 'http://localhost:5173' },
            body: { plate: 'LATE99' },
        }
        const res: any = createResponse()

        await handler(req, res)

        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                valid: false,
                message: 'No active booking found for this vehicle.',
            })
        )
    })
})