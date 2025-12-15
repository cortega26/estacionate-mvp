import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import { comparePassword, signToken } from '../../lib/auth.js'
import { serialize } from 'cookie'
import cors from '../../lib/cors.js'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res) // Enable CORS
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const { email, password } = loginSchema.parse(req.body)

        let resident = await db.resident.findUnique({
            where: { email },
            include: { unit: true }
        })

        if (resident && resident.passwordHash) {
            const isValid = await comparePassword(password, resident.passwordHash)
            if (!isValid) return res.status(401).json({ error: 'Invalid credentials' })

            const token = signToken({
                userId: resident.id,
                buildingId: resident.unit.buildingId,
                unitId: resident.unitId,
                role: 'resident'
            })

            const serialized = serialize('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', // Lax needed for top-level nav if any, Strict is safer but Strict prevents some flows. Strict is fine for API calls.
                maxAge: 60 * 60 * 24 * 7,
                path: '/'
            })
            res.setHeader('Set-Cookie', serialized)

            return res.status(200).json({
                success: true,
                // accessToken: token, // Removed for security
                user: {
                    id: resident.id,
                    email: resident.email,
                    firstName: resident.firstName,
                    lastName: resident.lastName,
                    isVerified: resident.isVerified,
                    role: 'resident'
                }
            })
        }

        // 2. Check Admin/User Table
        const user = await db.user.findUnique({
            where: { email }
        })

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const isValid = await comparePassword(password, user.passwordHash)
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' })

        if (!user.isActive) return res.status(403).json({ error: 'Account inactive' })

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
            // accessToken: token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isAuthenticated: true
            }
        })

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
