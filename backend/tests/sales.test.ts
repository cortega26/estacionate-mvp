
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { db } from '../src/lib/db.js';
import { signToken } from '../src/services/auth.js';
import { SalesService } from '../src/services/SalesService.js';


describe('Sales System & Admin User Management', () => {
    let adminToken: string;
    let salesRepId: string;
    let salesRepEmail: string;
    let buildingId: string;

    beforeAll(async () => {
        // Create Admin for API tests
        const adminEmail = `admin_sales_test_${Date.now()}@test.com`;
        const admin = await db.user.create({
            data: {
                email: adminEmail,
                passwordHash: 'hash',
                role: 'admin',
                isActive: true
            }
        });
        adminToken = signToken({ userId: admin.id, role: 'admin' });
    });

    afterAll(async () => {
        // Cleanup
        await db.salesRepCommission.deleteMany({ where: { salesRep: { email: salesRepEmail } } });
        await db.payout.deleteMany({ where: { buildingId } });
        if (buildingId) await db.building.delete({ where: { id: buildingId } });
        if (salesRepId) await db.user.delete({ where: { id: salesRepId } });
        // Admin cleanup omitted to avoid cascading delete issues if reused, but here it's unique
    });

    describe('Admin User Management (api/admin/users)', () => {
        it('should create a new Sales Rep via POST /api/admin/users', async () => {
            salesRepEmail = `rep_${Date.now()}@test.com`;
            const res = await request(app)
                .post('/api/admin/users')
                .set('Cookie', `token=${adminToken}`)
                .send({
                    email: salesRepEmail,
                    password: 'password123',
                    role: 'sales_rep',
                    firstName: 'John',
                    lastName: 'Doe'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe(salesRepEmail);
            expect(res.body.data.role).toBe('sales_rep');
            salesRepId = res.body.data.id;
        });

        it('should list users filtering by role', async () => {
            const res = await request(app)
                .get('/api/admin/users?role=sales_rep')
                .set('Cookie', `token=${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            const found = res.body.data.find((u: any) => u.email === salesRepEmail);
            expect(found).toBeTruthy();
        });

        it('should ban a user via PATCH /api/admin/users', async () => {
            const res = await request(app)
                .patch('/api/admin/users')
                .set('Cookie', `token=${adminToken}`)
                .send({
                    userId: salesRepId,
                    action: 'ban'
                });

            expect(res.status).toBe(200);
            expect(res.body.user.isActive).toBe(false);
        });

        it('should unban a user', async () => {
            const res = await request(app)
                .patch('/api/admin/users')
                .set('Cookie', `token=${adminToken}`)
                .send({
                    userId: salesRepId,
                    action: 'unban'
                });

            expect(res.status).toBe(200);
            expect(res.body.user.isActive).toBe(true);
        });
    });

    describe('SalesService Logic', () => {
        it('should set up a building for the sales rep', async () => {
            // Create a building
            const building = await db.building.create({
                data: {
                    name: `Sales Test Building ${Date.now()}`,
                    address: '123 Sales St',
                    totalUnits: 10,
                    contactEmail: 'contact@sales.com',
                    salesRepId: salesRepId,
                    salesRepCommissionRate: 0.10 // 10%
                }
            });
            buildingId = building.id;
            expect(building).toBeDefined();
        });

        it('should calculate commission correctly when a Payout is processed', async () => {
            // Mock a Payout
            const payout = await db.payout.create({
                data: {
                    buildingId: buildingId,
                    periodStart: new Date(),
                    periodEnd: new Date(),
                    totalRevenueClp: 100000,
                    platformCommissionClp: 10000, // 10k net revenue
                    buildingShareClp: 90000,
                    status: 'calculated'
                }
            });

            const commission = await SalesService.calculateCommission(payout);

            expect(commission).toBeDefined();
            expect(commission?.amountClp).toBe(1000); // 10% of 10,000
            expect(commission?.salesRepId).toBe(salesRepId);
            expect(commission?.status).toBe('pending');
        });

        it('should not calculate commission if building has no sales rep', async () => {
            // Remove rep
            await db.building.update({ where: { id: buildingId }, data: { salesRepId: null } });

            const payout2 = await db.payout.create({
                data: {
                    buildingId: buildingId,
                    periodStart: new Date(),
                    periodEnd: new Date(),
                    totalRevenueClp: 50000,
                    platformCommissionClp: 5000,
                    buildingShareClp: 45000,
                    status: 'calculated'
                }
            });

            const commission = await SalesService.calculateCommission(payout2);
            expect(commission).toBeUndefined();

            // Restore rep for next tests
            await db.building.update({ where: { id: buildingId }, data: { salesRepId: salesRepId } });
        });

        it('should return correct Dashboard Stats', async () => {
            const stats = await SalesService.getDashboardStats(salesRepId);
            expect(stats).toBeDefined();
            expect(stats.totalEarnings).toBe(1000); // The one commission we created
            expect(stats.activeBuildingsCount).toBe(1);
            expect(stats.recentCommissions.length).toBeGreaterThan(0);
        });

        it('should return Managed Buildings', async () => {
            const buildings = await SalesService.getManagedBuildings(salesRepId);
            expect(buildings.length).toBe(1);
            expect(buildings[0].id).toBe(buildingId);
        });
    });
});
