import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import { hashPassword } from '../../services/auth.js'
import { encrypt, hashPII } from '../../lib/crypto.js'
import cors from '../../lib/cors.js'

// Schema
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    rut: z.string().min(8), // Basic validation
    firstName: z.string(),
    lastName: z.string(),
    buildingId: z.string().uuid(),
    unitNumber: z.string(),
    phone: z.string().optional()
})


export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const data = signupSchema.parse(req.body)

        // 1. Check if Unit exists
        const unit = await db.unit.findUnique({
            where: {
                buildingId_unitNumber: {
                    buildingId: data.buildingId,
                    unitNumber: data.unitNumber
                }
            }
        })

        if (!unit) {
            // For MVP ease, we might auto-create unit if it allows, but spec implies rigorous building config.
            // We will error if unit doesn't exist to enforce correct setup.
            return res.status(400).json({ error: 'Unit not found in this building' })
        }


        // 2. Check if Resident (RUT/Email) exists
        // Use Blind Index for RUT lookup
        const rutHash = await hashPII(data.rut)

        const existing = await db.resident.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { rutHash: rutHash }
                ]
            }
        })

        if (existing) {
            return res.status(409).json({ error: 'Resident already registered' })
        }

        // 3. Create Resident
        const hashed = await hashPassword(data.password)
        const encryptedRut = await encrypt(data.rut)
        const encryptedPhone = data.phone ? await encrypt(data.phone) : null

        const resident = await db.resident.create({
            data: {
                email: data.email,
                passwordHash: hashed,
                rut: encryptedRut,
                rutHash: rutHash, // Blind Index
                firstName: data.firstName,
                lastName: data.lastName,
                phone: encryptedPhone, // Encrypted
                unitId: unit.id,
                isVerified: false
            }
        })

        // Return success (no token, wait for verification or separate login)
        return res.status(201).json({
            success: true,
            residentId: resident.id,
            message: 'Resident registered. Please login.'
        })

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
