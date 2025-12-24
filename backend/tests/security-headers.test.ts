import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js'; // Ensure app export exists and doesn't auto-listen

// Mock Redis to prevent connection errors during tests
vi.mock('../src/lib/redis.js', () => ({
    redis: {
        status: 'ready',
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

    // CORS Tests
    it('should allow whitelisted origin', async () => {
        const origin = 'https://cortega26.github.io';
        const res = await request(app)
            .get('/api/health')
            .set('Origin', origin);

        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe(origin);
    });

    it('should block disallowed origin', async () => {
        const origin = 'http://evil-site.com';
        const res = await request(app)
            .get('/api/health')
            .set('Origin', origin);

        // The custom CORS logic throws an Error('Not allowed by CORS')
        // which becomes a 500 with a generic message in the response body
        expect(res.status).toBe(403);

        // Crucially, the CORS header should NOT be present (or strictly not the origin)
        expect(res.headers['access-control-allow-origin']).toBeUndefined();

        // Verify Trace ID matches UUID format
        expect(res.body.trace_id).toBeDefined();
        // Simple regex for UUID v4
        expect(res.body.trace_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

        // Crucially, the CORS header should NOT be present (or strictly not the origin)
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
});
