import { beforeEach, describe, expect, it, vi } from 'vitest'
import forgotHandler from '../src/api/auth/forgot-password.js'
import resetHandler from '../src/api/auth/reset-password.js'
import { db } from '../src/lib/db.js'
import { logger } from '../src/lib/logger.js'
import { hashPassword } from '../src/services/auth.js'

vi.mock('../src/lib/cors.js', () => ({
    default: vi.fn(async () => undefined),
}))

vi.mock('../src/lib/db.js', () => ({
    db: {
        resident: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
    },
}))

vi.mock('../src/lib/logger.js', () => ({
    logger: {
        error: vi.fn(),
    },
}))

vi.mock('../src/services/NotificationService.js', () => ({
    NotificationService: {
        sendPasswordReset: vi.fn(async () => undefined),
    },
}))

vi.mock('../src/services/auth.js', () => ({
    hashPassword: vi.fn(),
}))

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
    getHeader: vi.fn(),
    end: vi.fn(),
})

describe('Auth recovery observability', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns 500 and logs structured context when forgot-password fails unexpectedly', async () => {
        vi.mocked(db.resident.findUnique).mockRejectedValue(new Error('forgot-recovery-failure'))

        const req: any = {
            method: 'POST',
            headers: { origin: 'http://localhost:5173' },
            body: { email: 'resident@test.com' },
        }
        const res: any = createResponse()

        await forgotHandler(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                route: 'auth.forgot-password',
                email: 'resident@test.com',
            }),
            expect.stringMatching(/forgot password error/i)
        )
    })

    it('returns 500 and logs structured context when reset-password fails unexpectedly', async () => {
        vi.mocked(db.resident.findFirst).mockResolvedValue({ id: 'resident-1' } as any)
        vi.mocked(hashPassword).mockRejectedValue(new Error('reset-hash-failure'))

        const req: any = {
            method: 'POST',
            headers: { origin: 'http://localhost:5173' },
            body: { token: '123456', newPassword: 'validpass' },
        }
        const res: any = createResponse()

        await resetHandler(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                route: 'auth.reset-password',
                tokenLength: 6,
            }),
            expect.stringMatching(/reset password error/i)
        )
    })
})
