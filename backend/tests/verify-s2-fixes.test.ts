import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Mocks
const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn()
}
const mockReq = (body: any) => ({
    method: 'POST',
    body,
    headers: {}
})

// Database Mock
const mockResidentUpdate = vi.fn()
const mockResidentFind = vi.fn()

vi.mock('../src/lib/db', () => ({
    db: {
        resident: {
            findUnique: (...args: any[]) => mockResidentFind(...args),
            update: (...args: any[]) => mockResidentUpdate(...args)
        },
        user: {
            findUnique: vi.fn()
        }
    }
}))

vi.mock('../src/services/auth.js', () => ({
    comparePassword: vi.fn(),
    signToken: vi.fn().mockReturnValue('mock-token'),
    getTokenFromRequest: vi.fn(),
    verifyToken: vi.fn()
}))

vi.mock('../src/lib/cors', () => ({
    default: vi.fn()
}))

vi.mock('cookie', () => ({
    serialize: vi.fn().mockReturnValue('cookie-string')
}))

vi.mock('../src/lib/redis.js', () => ({
    redis: {
        status: 'ready',
        incr: vi.fn(),
        expire: vi.fn(),
        get: vi.fn(),
        del: vi.fn(),
        on: vi.fn()
    }
}))

import loginHandler from '../src/api/auth/login.js'
import { comparePassword } from '../src/services/auth.js'
import { redis } from '../src/lib/redis.js'

describe('S2 Security Fixes Verification', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    const unverifiedResident = {
        id: 'res-1',
        email: 'test@example.com',
        unit: { buildingId: 'b1', unitId: 'u1' },
        passwordHash: 'hash',
        isVerified: false,
        failedLoginAttempts: 0,
        lockoutUntil: null
    }

    const verifiedResident = {
        ...unverifiedResident,
        isVerified: true
    }

    const lockedResident = {
        ...verifiedResident,
        lockoutUntil: new Date(Date.now() + 100000) // Future
    }

    describe('Fix 4 (S2): Verification Enforcement', () => {
        it('should reject unverified resident with 403', async () => {
            mockResidentFind.mockResolvedValue(unverifiedResident);
            (comparePassword as any).mockResolvedValue(true)

            await expect(loginHandler(mockReq({ email: 'test@example.com', password: 'password' }) as any, mockRes as any))
                .rejects.toMatchObject({
                    statusCode: 403,
                    code: 'AUTH-LOGIN-1003' // AUTH_NOT_VERIFIED
                })
        })
    })

    describe('Fix 5 (S2): Rate Limiting', () => {
        it('should reject locked account with 429', async () => {
            // Mock Redis lockout
            vi.mocked(redis.get).mockResolvedValue('5');

            await expect(loginHandler(mockReq({ email: 'test@example.com', password: 'password' }) as any, mockRes as any))
                .rejects.toMatchObject({
                    statusCode: 429,
                    code: 'AUTH-LOGIN-1002'
                })
        })

        it('should increment failed attempts on bad password', async () => {
            vi.mocked(redis.get).mockResolvedValue('0');

            mockResidentFind.mockResolvedValue(verifiedResident);
            (comparePassword as any).mockResolvedValue(false) // Wrong password

            await expect(loginHandler(mockReq({ email: 'test@example.com', password: 'wrong' }) as any, mockRes as any))
                .rejects.toMatchObject({
                    statusCode: 401,
                    code: 'AUTH-LOGIN-1001' // AUTH_INVALID_CREDENTIALS
                })

            // Verify Redis was incremented
            expect(redis.incr).toHaveBeenCalled();
        })
    })
})
