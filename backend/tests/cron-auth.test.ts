import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Request } from 'express'
import { verifyCronSecret } from '../src/lib/cronAuth.js'

const TEST_SECRET = 'test-cron-secret-abc123'

function makeReq(headers: Record<string, string> = {}): Request {
    return { headers } as unknown as Request
}

// Minimal mock for VercelRequest/Response to test handler-level 401
function mockVercelPair(method = 'GET', headers: Record<string, string> = {}) {
    const res: any = {
        statusCode: 0,
        body: null as any,
        status(code: number) { this.statusCode = code; return this },
        json(data: any) { this.body = data; return this },
    }
    const req: any = { method, headers, query: {}, body: {} }
    return { req, res }
}

describe('verifyCronSecret', () => {
    beforeAll(() => { process.env.CRON_SECRET = TEST_SECRET })
    afterAll(() => { delete process.env.CRON_SECRET })

    it('rejects when no header is present', () => {
        expect(verifyCronSecret(makeReq())).toBe(false)
    })

    it('rejects wrong Bearer token', () => {
        expect(verifyCronSecret(makeReq({ authorization: 'Bearer wrong-secret' }))).toBe(false)
    })

    it('rejects wrong x-cron-secret value', () => {
        expect(verifyCronSecret(makeReq({ 'x-cron-secret': 'wrong' }))).toBe(false)
    })

    it('rejects malformed Authorization (no Bearer prefix)', () => {
        expect(verifyCronSecret(makeReq({ authorization: TEST_SECRET }))).toBe(false)
    })

    it('accepts correct Bearer token', () => {
        expect(verifyCronSecret(makeReq({ authorization: `Bearer ${TEST_SECRET}` }))).toBe(true)
    })

    it('accepts correct x-cron-secret header', () => {
        expect(verifyCronSecret(makeReq({ 'x-cron-secret': TEST_SECRET }))).toBe(true)
    })

    it('returns false when CRON_SECRET env var is absent', () => {
        const saved = process.env.CRON_SECRET
        delete process.env.CRON_SECRET
        const result = verifyCronSecret(makeReq({ authorization: `Bearer ${saved}` }))
        process.env.CRON_SECRET = saved
        expect(result).toBe(false)
    })
})

describe('Cron handler auth guard — reconcile', () => {
    beforeAll(() => { process.env.CRON_SECRET = TEST_SECRET })
    afterAll(() => { delete process.env.CRON_SECRET })

    it('returns 401 without auth header', async () => {
        const { default: handler } = await import('../src/api/cron/reconcile.js')
        const { req, res } = mockVercelPair('GET', {})
        await handler(req, res)
        expect(res.statusCode).toBe(401)
        expect(res.body.error).toBe('Unauthorized')
    })

    it('returns 401 with wrong secret', async () => {
        const { default: handler } = await import('../src/api/cron/reconcile.js')
        const { req, res } = mockVercelPair('GET', { authorization: 'Bearer totally-wrong' })
        await handler(req, res)
        expect(res.statusCode).toBe(401)
    })

    it('passes auth with correct Bearer token (reaches handler logic, not 401)', async () => {
        const { default: handler } = await import('../src/api/cron/reconcile.js')
        const { req, res } = mockVercelPair('GET', { authorization: `Bearer ${TEST_SECRET}` })
        await handler(req, res)
        expect(res.statusCode).not.toBe(401)
    })
})

describe('Cron handler auth guard — cleanup-bookings', () => {
    beforeAll(() => { process.env.CRON_SECRET = TEST_SECRET })
    afterAll(() => { delete process.env.CRON_SECRET })

    it('returns 401 without auth header', async () => {
        const { default: handler } = await import('../src/api/cron/cleanup-bookings.js')
        const { req, res } = mockVercelPair('GET', {})
        await handler(req, res)
        expect(res.statusCode).toBe(401)
    })

    it('passes auth with correct x-cron-secret header', async () => {
        const { default: handler } = await import('../src/api/cron/cleanup-bookings.js')
        const { req, res } = mockVercelPair('GET', { 'x-cron-secret': TEST_SECRET })
        await handler(req, res)
        expect(res.statusCode).not.toBe(401)
    })
})

describe('Cron handler auth guard — worker', () => {
    beforeAll(() => { process.env.CRON_SECRET = TEST_SECRET })
    afterAll(() => { delete process.env.CRON_SECRET })

    it('returns 401 without auth header', async () => {
        const { default: handler } = await import('../src/api/cron/worker.js')
        const { req, res } = mockVercelPair('GET', {})
        await handler(req, res)
        expect(res.statusCode).toBe(401)
    })

    it('returns 200 with correct secret', async () => {
        const { default: handler } = await import('../src/api/cron/worker.js')
        const { req, res } = mockVercelPair('GET', { authorization: `Bearer ${TEST_SECRET}` })
        await handler(req, res)
        expect(res.statusCode).toBe(200)
        expect(res.body.success).toBe(true)
    })
})
