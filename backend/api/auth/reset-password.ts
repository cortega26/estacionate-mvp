import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { hashPassword } from '../../lib/auth.js'
import { User, Resident } from '@prisma/client'

const resetSchema = z.object({
    token: z.string().min(6),
    newPassword: z.string().min(6)
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const { token, newPassword } = resetSchema.parse(req.body)

        // 1. Try Resident
        let type = 'resident'
        let account: Resident | User | null = await db.resident.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiresAt: { gt: new Date() }
            }
        })

        // 2. Try User
        if (!account) {
            type = 'user'
            account = await db.user.findFirst({
                where: {
                    resetToken: token,
                    resetTokenExpiresAt: { gt: new Date() }
                }
            })
        }

        if (!account) {
            return res.status(400).json({ error: 'Invalid or expired token' })
        }

        // 3. Update Password
        const passwordHash = await hashPassword(newPassword)

        if (type === 'resident') {
            await db.resident.update({
                where: { id: account.id },
                data: { passwordHash, resetToken: null, resetTokenExpiresAt: null }
            })
        } else {
            await db.user.update({
                where: { id: account.id },
                data: { passwordHash, resetToken: null, resetTokenExpiresAt: null }
            })
        }

        return res.status(200).json({ success: true, message: 'Password updated successfully' })

    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors })
        console.error('Reset Password Error:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
