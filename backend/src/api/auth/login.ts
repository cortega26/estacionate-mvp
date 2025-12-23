
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import { Prisma } from '@prisma/client'
import { comparePassword, signToken, DUMMY_HASH } from '../../services/auth.js'
import { serialize } from 'cookie'
import cors from '../../lib/cors.js'
import { AppError, ErrorCode } from '../../lib/errors.js'
import { redis } from '../../lib/redis.js'
import { logger } from '../../lib/logger.js'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
})

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export default async function handler(req: VercelRequest, res: VercelResponse) {

    await cors(req, res)
    if (req.method !== 'POST') {
        throw new AppError({
            code: ErrorCode.SYSTEM_METHOD_NOT_ALLOWED,
            statusCode: 405,
            publicMessage: 'Método no permitido'
        });
    }

    const { email, password } = loginSchema.parse(req.body)

    // 0. Redis Rate Limit (Account Lockout)
    const lockoutKey = `login_fail:${email}`;
    let attempts = 0;
    try {
        const raw = await redis.get(lockoutKey);
        attempts = raw ? parseInt(raw) : 0;
    } catch (e) {
        logger.warn('Redis unreachable for rate limiting');
    }

    if (attempts >= MAX_ATTEMPTS) {
        throw new AppError({
            code: ErrorCode.AUTH_ACCOUNT_LOCKED,
            statusCode: 429,
            publicMessage: `Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos.`
        });
    }

    // 1. Parallel Lookup (Timing Mitigation for Existence)
    const [resident, user] = await Promise.all([
        db.resident.findUnique({ where: { email }, include: { unit: true } }),
        db.user.findUnique({ where: { email } })
    ]);

    const account = resident || user;
    const targetHash = account?.passwordHash || DUMMY_HASH;

    // 2. Constant Time Comparison (Mostly)
    const isValid = await comparePassword(password, targetHash);

    // 3. Validation Logic
    if (!account || !isValid) {
        // Increment Redis
        try {
            await redis.incr(lockoutKey);
            await redis.expire(lockoutKey, LOCKOUT_MINUTES * 60);
        } catch (e) {
            logger.warn(e, 'Redis unreachable for increment');
        }

        throw AppError.unauthorized(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Credenciales inválidas');
    }

    // 4. Status Checks
    if (resident && !resident.isVerified) {
        throw new AppError({
            code: ErrorCode.AUTH_NOT_VERIFIED,
            statusCode: 403,
            publicMessage: 'Cuenta no verificada. Por favor revise su correo o contacte a administración.'
        });
    }

    if (!account.isActive) {
        throw new AppError({
            code: ErrorCode.AUTH_INACTIVE,
            statusCode: 403,
            publicMessage: 'Cuenta inactiva'
        });
    }

    // Success - Clear Lockout
    try {
        await redis.del(lockoutKey);
    } catch (e) {
        logger.warn(e, 'Redis unreachable for delete');
    }

    // 5. Token Generation
    const role = resident ? 'RESIDENT' : (user?.role as string);
    const userId = account.id;
    const buildingId = resident ? resident.unit?.buildingId : (user?.buildingId ?? undefined);

    const token = signToken({
        userId,
        buildingId,
        role
    })

    const serialized = serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
    })
    res.setHeader('Set-Cookie', serialized)

    return res.status(200).json({
        success: true,
        user: {
            id: userId,
            email: account.email,
            role,
            isAuthenticated: true
        }
    })
}
