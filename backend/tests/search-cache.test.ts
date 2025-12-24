
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { db } from '../src/lib/db.js';
import { redis } from '../src/lib/redis.js';

// Mock dependencies (Hoist to top)
vi.mock('../src/lib/db.js', () => ({
    db: {
        availabilityBlock: {
            findMany: vi.fn()
        }
    }
}));

vi.mock('../src/lib/redis.js', () => ({
    redis: {
        get: vi.fn(),
        setex: vi.fn()
    }
}));

describe('GET /api/spots/search Caching', () => {
    const buildingId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID required by Zod

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return CACHED result if Redis has data', async () => {
        // 1. Setup Mock: Redis HIT
        const cachedData = [{ id: 'block-1', status: 'available' }];
        // Ensure we use the mocked methods
        vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData));

        // 2. Execute
        const res = await request(app)
            .get(`/api/spots/search?buildingId=${buildingId}`)
            .expect(200);

        // 3. Verify
        expect(res.body.success).toBe(true);
        expect(res.body.cached).toBe(true);
        expect(res.body.data[0].id).toBe('block-1');

        // CRITICAL: DB should NOT be touched
        expect(db.availabilityBlock.findMany).not.toHaveBeenCalled();
        expect(redis.get).toHaveBeenCalledWith(expect.stringContaining(`avail:search:${buildingId}`));
    });

    it('should fetch from DB and SET cache if Redis MISS', async () => {
        // 1. Setup Mock: Redis MISS
        vi.mocked(redis.get).mockResolvedValue(null);

        // Mock DB Return
        vi.mocked(db.availabilityBlock.findMany).mockResolvedValue([
            { id: 'db-block-1', status: 'available' } as any
        ]);

        // 2. Execute
        const res = await request(app)
            .get(`/api/spots/search?buildingId=${buildingId}`)
            .expect(200);

        // 3. Verify
        expect(res.body.success).toBe(true);
        expect(res.body.cached).toBeUndefined();
        expect(res.body.data[0].id).toBe('db-block-1');

        // CRITICAL: Cache SET should be called
        expect(redis.setex).toHaveBeenCalledWith(
            expect.stringContaining(`avail:search:${buildingId}`),
            60,
            expect.stringContaining('db-block-1')
        );
    });
});
