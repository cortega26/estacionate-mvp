import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import { comparePassword, signToken } from '../../services/auth.js'
import { serialize } from 'cookie'
import cors from '../../lib/cors.js'
import { AppError, ErrorCode } from '../../lib/errors.js'

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

    // ...

    const { email, password } = loginSchema.parse(req.body)

    // 1. Try Resident Login
    const resident = await db.resident.findUnique({
        where: { email },
        include: { unit: true }
    })

    if (resident && resident.passwordHash) {
        // Check Lockout
        if (resident.lockoutUntil && resident.lockoutUntil > new Date()) {
            const minutesLeft = Math.ceil((resident.lockoutUntil.getTime() - Date.now()) / 60000)
            throw new AppError({
                code: ErrorCode.AUTH_ACCOUNT_LOCKED,
                statusCode: 429,
                publicMessage: `Cuenta bloqueada. Intente nuevamente en ${minutesLeft} minutos`
            });
        }

        const isValid = await comparePassword(password, resident.passwordHash)
        if (!isValid) {
            // Increment Failed Attempts
            const attempts = resident.failedLoginAttempts + 1
            const data: any = { failedLoginAttempts: attempts }

            if (attempts >= MAX_ATTEMPTS) {
                const lockout = new Date()
                lockout.setMinutes(lockout.getMinutes() + LOCKOUT_MINUTES)
                data.lockoutUntil = lockout
            }

            await db.resident.update({ where: { id: resident.id }, data })
            throw AppError.unauthorized(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Credenciales inválidas');
        }

        // Success: Reset counters
        if (resident.failedLoginAttempts > 0 || resident.lockoutUntil) {
            await db.resident.update({
                where: { id: resident.id },
                data: { failedLoginAttempts: 0, lockoutUntil: null }
            })
        }

        if (!resident.isVerified) {
            throw new AppError({
                code: ErrorCode.AUTH_NOT_VERIFIED,
                statusCode: 403,
                publicMessage: 'Cuenta no verificada. Por favor revise su correo o contacte a administración.'
            });
        }

        if (!resident.isActive) {
            throw new AppError({
                code: ErrorCode.AUTH_INACTIVE,
                statusCode: 403,
                publicMessage: 'Cuenta inactiva'
            });
        }

        // ... (Token generation)

    }

    // 2. Try Admin/User Login
    const user = await db.user.findUnique({
        where: { email }
    })

    if (!user) {
        throw AppError.unauthorized(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Credenciales inválidas');
    }

    // Check Lockout (User)
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000)
        throw new AppError({
            code: ErrorCode.AUTH_ACCOUNT_LOCKED,
            statusCode: 429,
            publicMessage: `Cuenta bloqueada. Intente nuevamente en ${minutesLeft} minutos`
        });
    }

    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
        const attempts = user.failedLoginAttempts + 1
        const data: any = { failedLoginAttempts: attempts }

        if (attempts >= MAX_ATTEMPTS) {
            const lockout = new Date()
            lockout.setMinutes(lockout.getMinutes() + LOCKOUT_MINUTES)
            data.lockoutUntil = lockout
        }

        await db.user.update({ where: { id: user.id }, data })
        throw AppError.unauthorized(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Credenciales inválidas');
    }

    // ...

    if (!user.isActive) {
        throw new AppError({
            code: ErrorCode.AUTH_INACTIVE,
            statusCode: 403,
            publicMessage: 'Cuenta inactiva'
        });
    }

    const token = signToken({
        userId: user.id,
        buildingId: user.buildingId ?? undefined,
        role: user.role as string
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
            id: user.id,
            email: user.email,
            role: user.role,
            isAuthenticated: true
        }
    })
}
