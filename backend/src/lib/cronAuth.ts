import type { Request } from 'express'

// Fail-fast at startup in production; warn in dev
const _startupSecret = process.env.CRON_SECRET
if (!_startupSecret) {
    if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: CRON_SECRET is not set. Refusing to start.')
        process.exit(1)
    }
    if (process.env.NODE_ENV !== 'test') {
        console.warn('WARNING: CRON_SECRET is not set. Cron endpoints will reject all requests.')
    }
}

/**
 * Verifies the CRON_SECRET on an incoming request.
 * Returns true if the request carries the correct secret; false otherwise.
 *
 * Accepts the secret via:
 *   - Authorization: Bearer <secret>
 *   - x-cron-secret: <secret>  (Vercel Cron header)
 *
 * Reads process.env at call time so tests can inject the secret via beforeAll.
 */
export function verifyCronSecret(req: Request): boolean {
    const secret = process.env.CRON_SECRET
    if (!secret) return false

    const authHeader = req.headers['authorization']
    if (authHeader && authHeader === `Bearer ${secret}`) return true

    const cronHeader = req.headers['x-cron-secret']
    if (cronHeader && cronHeader === secret) return true

    return false
}
