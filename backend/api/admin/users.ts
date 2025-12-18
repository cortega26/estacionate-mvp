import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const updateUserSchema = z.object({
    userId: z.string(),
    action: z.enum(['ban', 'unban', 'promote_admin', 'demote_admin', 'assign_building']),
    buildingId: z.string().optional()
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'GET' && req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const token = getTokenFromRequest(req)
        if (!token) return res.status(401).json({ error: 'Unauthorized' })

        const requester = verifyToken(token)
        // Only Super Admin can manage users fully. Building Admin might view residents (future).
        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' })
        }

        // GET: List Users
        if (req.method === 'GET') {
            const page = parseInt(req.query.page as string) || 1
            const limit = 20
            const search = req.query.search as string

            const whereClause = search ? {
                OR: [
                    { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { phone: { contains: search, mode: Prisma.QueryMode.insensitive } }
                ]
            } : {}

            // @ts-ignore
            const users = await db.user.findMany({
                where: whereClause,
                take: limit,
                skip: (page - 1) * limit,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    building: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            // @ts-ignore
            const total = await db.user.count({ where: whereClause })

            return res.status(200).json({
                success: true,
                data: users,
                pagination: {
                    total,
                    page,
                    totalPages: Math.ceil(total / limit)
                }
            })
        }

        // PATCH: Update User
        if (req.method === 'PATCH') {
            const body = updateUserSchema.parse(req.body)

            let updateData: any = {}
            if (body.action === 'ban') updateData.isActive = false
            if (body.action === 'unban') updateData.isActive = true
            if (body.action === 'promote_admin') updateData.role = 'admin'
            if (body.action === 'demote_admin') updateData.role = 'building_admin' // Or support
            if (body.action === 'assign_building') {
                if (!body.buildingId) return res.status(400).json({ error: 'Building ID required' })
                updateData.buildingId = body.buildingId
            }

            const updatedUser = await db.user.update({
                where: { id: body.userId },
                data: updateData
            })

            return res.status(200).json({ success: true, user: updatedUser })
        }

    } catch (error: any) {
        console.error('User Management Error:', error)
        return res.status(500).json({ error: error.issues || 'Internal Server Error' })
    }
}
