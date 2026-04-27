import { vi, describe, it, expect, beforeEach } from 'vitest';
import loginHandler from '../src/api/auth/login.js';

const mockResidentFindUnique = vi.fn();
const mockUserFindUnique = vi.fn();
const mockComparePassword = vi.fn();
const mockSignToken = vi.fn().mockReturnValue('signed-token');
const mockRedisGet = vi.fn();
const mockRedisDel = vi.fn();
const mockRedisIncr = vi.fn();
const mockRedisExpire = vi.fn();

// Mock the cors helper to avoid dealing with network/middleware internals
vi.mock('../src/lib/cors.js', () => ({
    default: vi.fn().mockResolvedValue(true)
}));

// Mock DB to avoid needing a running database for this smoke test
// We just want to verify the handler logic flow and lack of crashes
vi.mock('../src/lib/db.js', () => ({
    db: {
        resident: {
            findUnique: (...args: any[]) => mockResidentFindUnique(...args)
        },
        user: {
            findUnique: (...args: any[]) => mockUserFindUnique(...args)
        }
    }
}));

vi.mock('../src/services/auth.js', () => ({
    comparePassword: (...args: any[]) => mockComparePassword(...args),
    signToken: (...args: any[]) => mockSignToken(...args),
    DUMMY_HASH: 'dummy-hash'
}));

vi.mock('../src/lib/redis.js', () => ({
    redis: {
        get: (...args: any[]) => mockRedisGet(...args),
        del: (...args: any[]) => mockRedisDel(...args),
        incr: (...args: any[]) => mockRedisIncr(...args),
        expire: (...args: any[]) => mockRedisExpire(...args)
    }
}));

describe('Login Logic Smoke Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockResidentFindUnique.mockResolvedValue(null);
        mockUserFindUnique.mockResolvedValue(null);
        mockComparePassword.mockResolvedValue(false);
        mockRedisGet.mockResolvedValue(null);
        mockRedisDel.mockResolvedValue(undefined);
        mockRedisIncr.mockResolvedValue(undefined);
        mockRedisExpire.mockResolvedValue(undefined);
    });

    it('should return 401 for user not found (Invalid credentials)', async () => {
        // Mock Request
        const req: any = {
            method: 'POST',
            body: {
                email: 'test@example.com',
                password: 'wrongpassword'
            },
            headers: {}
        };

        // Mock Response
        const res: any = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn()
        };



        // Since handler now THROWS AppError, we expect a rejection with the error object properties
        // Testing handler directly means we catch the throw.
        await expect(loginHandler(req as any, res as any)).rejects.toMatchObject({
            code: 'AUTH-LOGIN-1001',
            statusCode: 401
        });
    });

    it('should return 400 for invalid email format (Zod Validation)', async () => {
        const req: any = {
            method: 'POST',
            body: {
                email: 'not-an-email',
                password: 'password'
            },
            headers: {}
        };

        const res: any = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn()
        };

        // Zod Error is thrown directly
        await expect(loginHandler(req as any, res as any)).rejects.toThrow();
    });

    it('returns the normalized resident auth payload on successful login', async () => {
        mockResidentFindUnique.mockResolvedValue({
            id: 'resident-1',
            email: 'resident@estacionate.cl',
            firstName: 'Demo',
            lastName: 'Resident',
            isVerified: true,
            isActive: true,
            passwordHash: 'resident-hash',
            unit: {
                buildingId: 'building-1'
            }
        });
        mockComparePassword.mockResolvedValue(true);

        const req: any = {
            method: 'POST',
            body: {
                email: 'resident@estacionate.cl',
                password: 'password123'
            },
            headers: {}
        };

        const res: any = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn()
        };

        await loginHandler(req as any, res as any);

        expect(mockSignToken).toHaveBeenCalledWith({
            userId: 'resident-1',
            buildingId: 'building-1',
            role: 'RESIDENT'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            user: {
                id: 'resident-1',
                email: 'resident@estacionate.cl',
                firstName: 'Demo',
                lastName: 'Resident',
                isVerified: true,
                buildingId: 'building-1',
                role: 'resident',
                isAuthenticated: true
            }
        });
    });

    it('returns the normalized admin auth payload on successful login', async () => {
        mockUserFindUnique.mockResolvedValue({
            id: 'admin-1',
            email: 'admin@estacionate.cl',
            role: 'admin',
            buildingId: 'building-2',
            isActive: true,
            passwordHash: 'admin-hash'
        });
        mockComparePassword.mockResolvedValue(true);

        const req: any = {
            method: 'POST',
            body: {
                email: 'admin@estacionate.cl',
                password: 'password123'
            },
            headers: {}
        };

        const res: any = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn()
        };

        await loginHandler(req as any, res as any);

        expect(mockSignToken).toHaveBeenCalledWith({
            userId: 'admin-1',
            buildingId: 'building-2',
            role: 'admin'
        });
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            user: {
                id: 'admin-1',
                email: 'admin@estacionate.cl',
                firstName: '',
                lastName: '',
                isVerified: true,
                buildingId: 'building-2',
                role: 'admin',
                isAuthenticated: true
            }
        });
    });

    it.each([
        {
            role: 'building_admin',
            user: {
                id: 'building-admin-1',
                email: 'badmin@estacionate.cl',
                role: 'building_admin',
                buildingId: 'building-9',
                isActive: true,
                passwordHash: 'hash'
            },
            expected: {
                buildingId: 'building-9'
            }
        },
        {
            role: 'concierge',
            user: {
                id: 'concierge-1',
                email: 'concierge@estacionate.cl',
                role: 'concierge',
                buildingId: 'building-3',
                isActive: true,
                passwordHash: 'hash'
            },
            expected: {
                buildingId: 'building-3'
            }
        },
        {
            role: 'support',
            user: {
                id: 'support-1',
                email: 'support@estacionate.cl',
                role: 'support',
                isActive: true,
                passwordHash: 'hash'
            },
            expected: {
                buildingId: undefined
            }
        },
        {
            role: 'sales_rep',
            user: {
                id: 'sales-1',
                email: 'sales@estacionate.cl',
                role: 'sales_rep',
                isActive: true,
                passwordHash: 'hash'
            },
            expected: {
                buildingId: undefined
            }
        }
    ])('returns the normalized $role auth payload on successful login', async ({ user, expected, role }) => {
        mockUserFindUnique.mockResolvedValue(user);
        mockComparePassword.mockResolvedValue(true);

        const req: any = {
            method: 'POST',
            body: {
                email: user.email,
                password: 'password123'
            },
            headers: {}
        };

        const res: any = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn()
        };

        await loginHandler(req as any, res as any);

        expect(mockSignToken).toHaveBeenCalledWith({
            userId: user.id,
            buildingId: expected.buildingId,
            role: user.role
        });
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: '',
                lastName: '',
                isVerified: true,
                buildingId: expected.buildingId,
                role,
                isAuthenticated: true
            }
        });
    });
});
