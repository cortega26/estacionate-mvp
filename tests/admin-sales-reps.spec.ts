import { expect, test } from './playwright.js';

const mockAdminLogin = async (page: import('../frontend/node_modules/@playwright/test/index.js').Page) => {
    await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                user: {
                    id: 'admin-1',
                    email: 'admin@estacionate.cl',
                    firstName: '',
                    lastName: '',
                    isVerified: true,
                    role: 'admin',
                    isAuthenticated: true,
                },
            }),
        });
    });

    await page.route('**/api/admin/stats**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: {
                    revenue: 0,
                    activeBookings: 0,
                    totalSpots: 0,
                    occupancyRate: 0,
                    revenueOverTime: [],
                    recentActivity: [],
                },
            }),
        });
    });
};

test.describe('Admin Sales-Rep Building Removal Confirmation', () => {
    test('lets admins cancel sales-rep unassignment before any mutation is sent', async ({ page }) => {
        let updateRequestCount = 0;

        await mockAdminLogin(page);

        await page.route('**/api/admin/users?role=sales_rep**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        {
                            id: 'rep-1',
                            email: 'sales1@estacionate.cl',
                            role: 'sales_rep',
                            isActive: true,
                            createdAt: '2026-04-26T12:00:00.000Z',
                        },
                    ],
                }),
            });
        });

        await page.route('**/api/admin/buildings**', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: [
                            {
                                id: 'building-1',
                                name: 'Torre Norte',
                                salesRepId: 'rep-1',
                                salesRepCommissionRate: 0.1,
                                salesRep: { id: 'rep-1', email: 'sales1@estacionate.cl' },
                            },
                        ],
                    }),
                });
                return;
            }

            if (route.request().method() === 'PUT') {
                updateRequestCount += 1;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true }),
            });
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        await page.goto('/admin/sales-reps');
        await expect(page.getByRole('heading', { name: /Sales Reps Management/i })).toBeVisible();

        await page.getByRole('button', { name: /Manage Buildings/i }).click();
        await page.getByRole('button', { name: /^Remove$/i }).click();

        await expect(page.getByRole('heading', { name: /Confirmar desvinculacion/i })).toBeVisible();
        await page.getByRole('button', { name: /Cancelar/i }).click();

        await expect(page.getByRole('heading', { name: /Confirmar desvinculacion/i })).toHaveCount(0);
        expect(updateRequestCount).toBe(0);
    });

    test('sends sales-rep unassignment payload only after explicit confirmation', async ({ page }) => {
        let payload: { id?: string; salesRepId?: string | null; salesRepCommissionRate?: number } | null = null;

        await mockAdminLogin(page);

        await page.route('**/api/admin/users?role=sales_rep**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        {
                            id: 'rep-1',
                            email: 'sales1@estacionate.cl',
                            role: 'sales_rep',
                            isActive: true,
                            createdAt: '2026-04-26T12:00:00.000Z',
                        },
                    ],
                }),
            });
        });

        await page.route('**/api/admin/buildings**', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: [
                            {
                                id: 'building-1',
                                name: 'Torre Norte',
                                salesRepId: 'rep-1',
                                salesRepCommissionRate: 0.1,
                                salesRep: { id: 'rep-1', email: 'sales1@estacionate.cl' },
                            },
                        ],
                    }),
                });
                return;
            }

            if (route.request().method() === 'PUT') {
                payload = await route.request().postDataJSON();
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true }),
            });
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        await page.goto('/admin/sales-reps');
        await expect(page.getByRole('heading', { name: /Sales Reps Management/i })).toBeVisible();

        await page.getByRole('button', { name: /Manage Buildings/i }).click();
        await page.getByRole('button', { name: /^Remove$/i }).click();

        await expect(page.getByRole('heading', { name: /Confirmar desvinculacion/i })).toBeVisible();
        await page.getByRole('button', { name: /Confirmar/i }).click();

        expect(payload).toEqual({
            id: 'building-1',
            salesRepId: null,
            salesRepCommissionRate: 0.05,
        });
    });
});
