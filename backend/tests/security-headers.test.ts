import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js'; // Ensure app export exists and doesn't auto-listen

// Mock Redis to prevent connection errors during tests
vi.mock('../lib/redis.js', () => ({
    redis: {
        status: 'end',
        incr: vi.fn(),
        expire: vi.fn(),
    }
}));

describe('Security Headers', () => {
    it('should set Strict Content-Security-Policy', async () => {
        const res = await request(app).get('/api/health'); // Health endpoint is lightweight

        expect(res.headers['content-security-policy']).toBeDefined();
        // Check for strict default-src 'none'
        expect(res.headers['content-security-policy']).toContain("default-src 'none'");
        // Check for strict upgrade-insecure-requests
        expect(res.headers['content-security-policy']).toContain("upgrade-insecure-requests");
    });

    it('should set X-Content-Type-Options to nosniff', async () => {
        const res = await request(app).get('/api/health');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options to DENY', async () => {
        const res = await request(app).get('/api/health');
        expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('should set Referrer-Policy', async () => {
        const res = await request(app).get('/api/health');
        expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
});
