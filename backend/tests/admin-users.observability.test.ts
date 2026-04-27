import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../src/api/admin/users.js'
import { db } from '../src/lib/db.js'
import { logger } from '../src/lib/logger.js'
import { getTokenFromRequest, verifyToken } from '../src/services/auth.js'

vi.mock('../src/lib/cors.js', () => ({
    default: vi.fn(async () => undefined),
}))

vi.mock('../src/lib/db.js', () => ({
    db: {
        user: {
            findMany: vi.fn(),
        },
        resident: {
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

describe('Admin users observability', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getTokenFromRequest).mockReturnValue('valid-token')
        vi.mocked(verifyToken).mockReturnValue({
            userId: 'admin-1',
            role: 'admin',
        } as any)
    })

    it('returns 500 and logs structured context when users listing fails', async () => {
        vi.mocked(db.user.findMany).mockRejectedValue(new Error('admin-users-failure'))

        const req: any = {
            method: 'GET',
            headers: { origin: 'http://localhost:5173' },
            query: { page: '1' },
        }
        const res: any = createResponse()

        await handler(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                route: 'admin.users',
                method: 'GET',
                actorRole: 'admin',
                actorId: 'admin-1',
            }),
            expect.stringMatching(/user management error/i)
        )
    })
})
