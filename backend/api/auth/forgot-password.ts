import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { NotificationService } from '../../services/NotificationService.js'
import { v4 as uuidv4 } from 'uuid';

const forgotSchema = z.object({
    email: z.string().email()
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const { email } = forgotSchema.parse(req.body)

        // 1. Try Resident
        const resident = await db.resident.findUnique({ where: { email } })
        if (resident && resident.phone) {
            await handleRecovery(resident.id, resident.phone, 'resident')
        }

        // 2. Try User (Admin)
        if (!resident) {
            const user = await db.user.findUnique({ where: { email } })
            if (user && user.phone) {
                await handleRecovery(user.id, user.phone, 'user')
            }
        }

        // Always return success to prevent enumeration
        return res.status(200).json({ success: true, message: 'If an account exists, a recovery code has been sent.' })

    } catch (error: unknown) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors })
        console.error('Forgot Password Error:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

async function handleRecovery(id: string, phone: string, type: 'resident' | 'user') {
    const _token = uuidv4().split('-')[0].toUpperCase(); // Short code for SMS/WhatsApp friendly (e.g. A1B2C3)
    // Actually full UUID might be safer but harder to type. Let's stick to short 6-char for MVP WhatsApp friendly.
    // Or generated 6-digit numeric.
    const shortCode = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 mins

    if (type === 'resident') {
        await db.resident.update({
            where: { id },
            data: { resetToken: shortCode, resetTokenExpiresAt: expiresAt }
        })
    } else {
        await db.user.update({
            where: { id },
            data: { resetToken: shortCode, resetTokenExpiresAt: expiresAt }
        })
    }

    await NotificationService.sendPasswordReset(phone, shortCode);
}
