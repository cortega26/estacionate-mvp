import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../src/api/spots/search.js'
import { db } from '../src/lib/db.js'
import { logger } from '../src/lib/logger.js'

vi.mock('../src/lib/cors.js', () => ({
    default: vi.fn(async () => undefined),
}))

vi.mock('../src/lib/db.js', () => ({
    db: {
        availabilityBlock: {
            findMany: vi.fn(),
        },
    },
}))

vi.mock('../src/lib/redis.js', () => ({
    redis: {
        get: vi.fn(async () => null),
        setex: vi.fn(async () => 'OK'),
    },
}))

vi.mock('../src/lib/logger.js', () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
    getHeader: vi.fn(),
    end: vi.fn(),
})

describe('Spots search observability', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns 500 and logs structured context when search query fails unexpectedly', async () => {
        vi.mocked(db.availabilityBlock.findMany).mockRejectedValue(new Error('search-query-failure'))

        const req: any = {
            method: 'GET',
            headers: { origin: 'http://localhost:5173' },
            query: {
                buildingId: '478c9ef2-7087-42cc-a255-70200d1e7618',
                date: '2026-04-27',
                durationType: '11h',
            },
        }
        const res: any = createResponse()

        await handler(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                route: 'spots.search',
                buildingId: '478c9ef2-7087-42cc-a255-70200d1e7618',
                durationType: '11h',
            }),
            expect.stringMatching(/spots search error/i)
        )
    })
})
