import { beforeEach, describe, expect, it, vi } from 'vitest'
import verifyHandler from '../src/api/concierge/verify.js'
import dashboardHandler from '../src/api/concierge/dashboard.js'
import { db } from '../src/lib/db.js'
import { logger } from '../src/lib/logger.js'
import { getTokenFromRequest, verifyToken } from '../src/services/auth.js'

vi.mock('../src/lib/cors.js', () => ({
    default: vi.fn(async () => undefined),
}))

vi.mock('../src/lib/db.js', () => ({
    db: {
        booking: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
        },
    },
}))

vi.mock('../src/lib/logger.js', () => ({
    logger: {
        error: vi.fn(),
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

describe('Concierge observability', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getTokenFromRequest).mockReturnValue('valid-token')
        vi.mocked(verifyToken).mockReturnValue({
            userId: 'concierge-1',
            role: 'concierge',
            buildingId: 'building-1',
        } as any)
    })

    it('logs structured context when verify handler fails with server error', async () => {
        vi.mocked(db.booking.findFirst).mockRejectedValue(new Error('verify-db-failure'))

        const req: any = {
            method: 'POST',
            headers: { origin: 'http://localhost:5173' },
            body: { plate: 'ABCD12' },
        }
        const res: any = createResponse()

        await verifyHandler(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                route: 'concierge.verify',
                actorRole: 'concierge',
                actorId: 'concierge-1',
                buildingId: 'building-1',
            }),
            expect.stringMatching(/concierge verify error/i)
        )
    })

    it('logs structured context when dashboard handler fails with server error', async () => {
        vi.mocked(db.booking.findMany).mockRejectedValue(new Error('dashboard-db-failure'))

        const req: any = {
            method: 'GET',
            headers: { origin: 'http://localhost:5173' },
            query: {},
        }
        const res: any = createResponse()

        await dashboardHandler(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                route: 'concierge.dashboard',
                actorRole: 'concierge',
                actorId: 'concierge-1',
                buildingId: 'building-1',
            }),
            expect.stringMatching(/concierge dashboard error/i)
        )
    })
})
