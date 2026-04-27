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

test.describe('Admin Buildings Confirmation Clarity', () => {
    test('lets admins cancel archive and delete actions before any request is sent', async ({ page }) => {
        let updateRequests = 0;
        let deleteRequests = 0;

        await mockAdminLogin(page);

        await page.route('**/api/admin/buildings?activeOnly=*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: [
                        {
                            id: 'building-1',
                            name: 'Torre Norte',
                            address: 'Av. Norte 101',
                            isDemo: false,
                            isActive: true,
                            platformCommissionRate: 0.1,
                            softwareMonthlyFeeClp: 25000,
                            totalUnits: 30,
                            totalVisitorSpots: 10,
                            stats: {
                                totalRevenueClp: 120000,
                                platformCommissionClp: 12000,
                                softwareFeeClp: 25000,
                                totalEarningsClp: 37000,
                            },
                        },
                    ],
                }),
            });
        });

        await page.route('**/api/admin/buildings**', async (route) => {
            if (route.request().method() === 'PUT') {
                updateRequests += 1;
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
                return;
            }

            if (route.request().method() === 'DELETE') {
                deleteRequests += 1;
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
                return;
            }

            await route.fallback();
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        await page.goto('/admin/buildings');
        const buildingRow = page.getByRole('row').filter({ hasText: 'Torre Norte' });

        await buildingRow.getByRole('button', { name: 'Archivar' }).click();
        await expect(page.getByRole('heading', { name: /Confirmar acción sobre edificio/i })).toBeVisible();
        await expect(page.getByRole('definition').filter({ hasText: /^Torre Norte$/ })).toBeVisible();
        await expect(page.getByRole('definition').filter({ hasText: /^Archivar$/ })).toBeVisible();
        await page.getByRole('button', { name: 'Cancelar' }).click();

        expect(updateRequests).toBe(0);
        await expect(page.getByRole('heading', { name: /Confirmar acción sobre edificio/i })).toHaveCount(0);

        await buildingRow.getByRole('button', { name: 'Eliminar permanentemente' }).click();
        await expect(page.getByRole('heading', { name: /Confirmar acción sobre edificio/i })).toBeVisible();
        await expect(page.getByRole('definition').filter({ hasText: /^Eliminar$/ })).toBeVisible();
        await page.getByRole('button', { name: 'Cancelar' }).click();

        expect(deleteRequests).toBe(0);
    });

    test('sends archive and delete requests only after explicit confirmation', async ({ page }) => {
        let buildings = [
            {
                id: 'building-1',
                name: 'Torre Norte',
                address: 'Av. Norte 101',
                isDemo: false,
                isActive: true,
                platformCommissionRate: 0.1,
                softwareMonthlyFeeClp: 25000,
                totalUnits: 30,
                totalVisitorSpots: 10,
                stats: {
                    totalRevenueClp: 120000,
                    platformCommissionClp: 12000,
                    softwareFeeClp: 25000,
                    totalEarningsClp: 37000,
                },
            },
        ];
        const updatePayloads: Array<{ id?: string; isActive?: boolean }> = [];
        const deleteUrls: string[] = [];

        await mockAdminLogin(page);

        await page.route('**/api/admin/buildings?activeOnly=*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: buildings }),
            });
        });

        await page.route('**/api/admin/buildings**', async (route) => {
            if (route.request().method() === 'PUT') {
                const payload = await route.request().postDataJSON();
                updatePayloads.push(payload);
                buildings = buildings.map((building) => building.id === payload.id ? { ...building, isActive: payload.isActive } : building);
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
                return;
            }

            if (route.request().method() === 'DELETE') {
                deleteUrls.push(route.request().url());
                buildings = [];
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
                return;
            }

            await route.fallback();
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        await page.goto('/admin/buildings');
        const buildingRow = page.getByRole('row').filter({ hasText: 'Torre Norte' });

        await buildingRow.getByRole('button', { name: 'Archivar' }).click();
        await page.getByRole('button', { name: /Confirmar acción/i }).click();

        expect(updatePayloads).toEqual([{ id: 'building-1', isActive: false }]);
        await expect(buildingRow.getByText('Archivado')).toBeVisible();

        await buildingRow.getByRole('button', { name: 'Eliminar permanentemente' }).click();
        await page.getByRole('button', { name: /Confirmar acción/i }).click();

        expect(deleteUrls).toEqual(['http://localhost:5173/api/admin/buildings?id=building-1']);
        await expect(page.getByText('Torre Norte')).toHaveCount(0);
    });

    test('explains demo cleanup before deleting a demo building', async ({ page }) => {
        let deleteRequests = 0;
        let demoBuildings = [
            {
                id: 'building-demo',
                name: 'Edificio Demo Centro',
                address: 'Av. Providencia 2000',
                isDemo: true,
                isActive: true,
                platformCommissionRate: 0.1,
                softwareMonthlyFeeClp: 0,
                totalUnits: 50,
                totalVisitorSpots: 5,
                stats: {
                    totalRevenueClp: 15000,
                    platformCommissionClp: 1500,
                    softwareFeeClp: 0,
                    totalEarningsClp: 1500,
                },
            },
        ];

        await mockAdminLogin(page);

        await page.route('**/api/admin/buildings?activeOnly=*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: demoBuildings }),
            });
        });

        await page.route('**/api/admin/buildings**', async (route) => {
            if (route.request().method() === 'DELETE') {
                deleteRequests += 1;
                demoBuildings = [];
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
                return;
            }

            await route.fallback();
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        await page.goto('/admin/buildings');
        const buildingRow = page.getByRole('row').filter({ hasText: 'Edificio Demo Centro' });

        await expect(buildingRow.getByText(/^Demo$/)).toBeVisible();

        await buildingRow.getByRole('button', { name: 'Eliminar permanentemente' }).click();
        await expect(page.getByText(/se limpiarán residentes, reservas y pagos demo asociados/i)).toBeVisible();
        await expect(page.getByText(/Conflicto: Registros Asociados detectados/i)).toHaveCount(0);

        await page.getByRole('button', { name: /Confirmar acción/i }).click();

        expect(deleteRequests).toBe(1);
        await expect(page.getByText('Edificio Demo Centro')).toHaveCount(0);
    });
});