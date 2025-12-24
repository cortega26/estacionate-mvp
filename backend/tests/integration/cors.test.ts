
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '../../app.js';

describe('Security Integration: CORS', () => {
    it('should allow requests from whitelisted origin (localhost:5173)', async () => {
        const res = await request(app)
            .get('/api/health') // Assuming this route might not exist, but middleware runs before 404
            .set('Origin', 'http://localhost:5173');

        // We expect CORS headers to be present
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
        expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should block requests from unauthorized origin (evil.com)', async () => {
        const res = await request(app)
            .get('/api/health')
            .set('Origin', 'http://evil.com');

        // Should return 403 Forbidden with specific error message defined in lib/cors.ts
        expect(res.status).toBe(403);
        // The error response structure usually is { error: "..." } or similar depending on errorHandler
        // But the cors middleware throws AppError.forbidden which has message 'CORS: Origin not allowed'
        // Let's check status first.
    });

    it('should allow requests with no origin (mobile/curl)', async () => {
        const res = await request(app)
            .get('/api/health');

        // Should not be 403. might be 404 (Not Found) if route is missing, which is fine.
        expect(res.status).not.toBe(403);
    });
});
