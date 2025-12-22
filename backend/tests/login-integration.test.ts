import { vi, describe, it, expect } from 'vitest';
import loginHandler from '../src/api/auth/login.js';

// Mock the cors helper to avoid dealing with network/middleware internals
vi.mock('../src/lib/cors.js', () => ({
    default: vi.fn().mockResolvedValue(true)
}));

// Mock DB to avoid needing a running database for this smoke test
// We just want to verify the handler logic flow and lack of crashes
vi.mock('../src/lib/db.js', () => ({
    db: {
        resident: {
            findUnique: vi.fn().mockResolvedValue(null) // Simulate user not found
        },
        user: {
            findUnique: vi.fn().mockResolvedValue(null) // Simulate user not found
        }
    }
}));

describe('Login Logic Smoke Test', () => {
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
});
