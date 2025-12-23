import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import { z } from 'zod'
import { Prisma, Role } from '@prisma/client'

const updateUserSchema = z.object({
    userId: z.string(),
    action: z.enum(['ban', 'unban', 'promote_admin', 'demote_admin', 'assign_building']),
    buildingId: z.string().optional()
})

const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(12, 'Password must be at least 12 characters'),
    role: z.enum(['admin', 'sales_rep', 'building_admin', 'support']).default('sales_rep'),
    firstName: z.string().optional(),
    lastName: z.string().optional()
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'GET' && req.method !== 'PATCH' && req.method !== 'POST') {
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
            const role = req.query.role as string

            const whereClause: Prisma.UserWhereInput = {
                ...(search ? {
                    OR: [
                        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
                        { phone: { contains: search, mode: Prisma.QueryMode.insensitive } }
                    ]
                } : {}),
                ...(role ? { role: role as Prisma.EnumRoleFilter } : {})
            }



            const [users, total] = await Promise.all([
                db.user.findMany({
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
                }),
                db.user.count({ where: whereClause })
            ]);

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

        // POST: Create User
        if (req.method === 'POST') {
            const body = createUserSchema.parse(req.body)

            // Check if exists
            const existing = await db.user.findUnique({ where: { email: body.email } })
            if (existing) {
                return res.status(409).json({ error: 'User already exists' })
            }

            // Import hash from auth service if available or implement basic hash
            // Since we don't have access to bcrypt directly here without import, let's assume hashPassword fn exists or use bcryptjs
            // I'll grab bcryptjs here since it is in package.json
            const bcrypt = (await import('bcryptjs')).default
            const passwordHash = await bcrypt.hash(body.password, 10)

            const newUser = await db.user.create({
                data: {
                    email: body.email,
                    role: body.role as Role,
                    passwordHash,
                    isActive: true
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            })

            return res.status(201).json({ success: true, data: newUser })
        }

        // PATCH: Update User
        if (req.method === 'PATCH') {
            const body = updateUserSchema.parse(req.body)

            const updateData: Prisma.UserUpdateInput = {}
            if (body.action === 'ban') updateData.isActive = false
            if (body.action === 'unban') updateData.isActive = true
            if (body.action === 'promote_admin') updateData.role = 'admin'
            if (body.action === 'demote_admin') updateData.role = 'building_admin' // Or support
            if (body.action === 'assign_building') {
                if (!body.buildingId) return res.status(400).json({ error: 'Building ID required' })
                updateData.building = { connect: { id: body.buildingId } }
            }

            const updatedUser = await db.user.update({
                where: { id: body.userId },
                data: updateData
            })

            return res.status(200).json({ success: true, user: updatedUser })
        }

    } catch (error: unknown) {
        console.error('User Management Error:', error)
        if (error instanceof z.ZodError) return res.status(500).json({ error: error.issues })
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
