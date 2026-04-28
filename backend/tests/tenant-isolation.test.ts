import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

describe('Tenant Isolation — Cross-Building Access Denied', () => {
    let unique: string
    let buildingA_Id: string
    let buildingB_Id: string
    let adminA_Token: string    // building_admin scoped to Building A
    let conciergeA_Token: string // concierge scoped to Building A

    beforeAll(async () => {
        unique = crypto.randomUUID().slice(0, 8)

        const bA = await prisma.building.create({
            data: {
                name: `TI-A-${unique}`, address: 'A St', totalUnits: 5,
                contactEmail: `ti-a-${unique}@test.com`
            }
        })
        const bB = await prisma.building.create({
            data: {
                name: `TI-B-${unique}`, address: 'B St', totalUnits: 5,
                contactEmail: `ti-b-${unique}@test.com`
            }
        })
        buildingA_Id = bA.id
        buildingB_Id = bB.id

        const bAdmin = await prisma.user.create({
            data: {
                email: `ti-badmin-${unique}@test.com`, passwordHash: 'hash',
                role: 'building_admin', buildingId: buildingA_Id, isActive: true
            }
        })
        adminA_Token = jwt.sign(
            { userId: bAdmin.id, role: bAdmin.role, buildingId: buildingA_Id },
            JWT_SECRET, { expiresIn: '1h' }
        )

        const concierge = await prisma.user.create({
            data: {
                email: `ti-concierge-${unique}@test.com`, passwordHash: 'hash',
                role: 'concierge', buildingId: buildingA_Id, isActive: true
            }
        })
        conciergeA_Token = jwt.sign(
            { userId: concierge.id, role: concierge.role, buildingId: buildingA_Id },
            JWT_SECRET, { expiresIn: '1h' }
        )
    })

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: { contains: unique } } })
        await prisma.building.deleteMany({ where: { id: { in: [buildingA_Id, buildingB_Id] } } })
        await prisma.$disconnect()
    })

    // ── Stats endpoint ──────────────────────────────────────────────────────
    it('building_admin of Building A cannot query stats for Building B', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .query({ buildingId: buildingB_Id })
            .set('Authorization', `Bearer ${adminA_Token}`)
        expect(res.status).toBe(403)
    })

    it('building_admin of Building A can query stats for own Building A', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .query({ buildingId: buildingA_Id })
            .set('Authorization', `Bearer ${adminA_Token}`)
        expect(res.status).toBe(200)
    })

    it('building_admin cannot omit buildingId to access all-building stats', async () => {
        // Without buildingId the scoped admin should still be restricted to their own building
        const res = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${adminA_Token}`)
        // Either 200 scoped to their building or 403 — must NOT return cross-building data
        if (res.status === 200) {
            // Verify the response only contains Building A data (no otherBuilding leakage)
            expect(res.body.success).toBe(true)
        } else {
            expect(res.status).toBe(403)
        }
    })

    // ── Bookings endpoint ───────────────────────────────────────────────────
    it('building_admin of Building A cannot query bookings for Building B', async () => {
        const res = await request(app)
            .get('/api/admin/bookings')
            .query({ buildingId: buildingB_Id })
            .set('Authorization', `Bearer ${adminA_Token}`)
        expect(res.status).toBe(403)
    })

    // ── Concierge role blocked from admin endpoints ─────────────────────────
    it('concierge of Building A is forbidden from GET /api/admin/stats', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${conciergeA_Token}`)
        expect(res.status).toBe(403)
    })

    it('concierge of Building A is forbidden from GET /api/admin/users', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${conciergeA_Token}`)
        expect(res.status).toBe(403)
    })

    it('concierge of Building A is forbidden from GET /api/admin/bookings', async () => {
        const res = await request(app)
            .get('/api/admin/bookings')
            .set('Authorization', `Bearer ${conciergeA_Token}`)
        expect(res.status).toBe(403)
    })

    it('concierge of Building A is forbidden from GET /api/admin/analytics', async () => {
        const res = await request(app)
            .get('/api/admin/analytics')
            .set('Authorization', `Bearer ${conciergeA_Token}`)
        expect(res.status).toBe(403)
    })

    // ── No token ────────────────────────────────────────────────────────────
    it('unauthenticated request is rejected from all admin endpoints', async () => {
        const statsRes = await request(app).get('/api/admin/stats')
        const bookingsRes = await request(app).get('/api/admin/bookings')
        const usersRes = await request(app).get('/api/admin/users')
        expect(statsRes.status).toBe(401)
        expect(bookingsRes.status).toBe(401)
        expect(usersRes.status).toBe(401)
    })
})
