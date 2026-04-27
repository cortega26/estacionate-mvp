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

test.describe('Admin Settings Confirmation Clarity', () => {
    test('lets admins review and cancel a bulk price update without sending the mutation', async ({ page }) => {
        let updateRequestCount = 0;

        await mockAdminLogin(page);

        await page.route('**/api/buildings**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        { id: 'building-1', name: 'Torre Norte' },
                    ],
                }),
            });
        });

        await page.route('**/api/admin/prices', async (route) => {
            updateRequestCount += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, updatedCount: 12 }),
            });
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        await page.goto('/admin/settings');
        await expect(page.getByRole('heading', { name: /Configuración/i })).toBeVisible();
        await page.locator('select').selectOption('building-1');
        await page.getByRole('spinbutton').fill('1800');
        await page.getByRole('button', { name: /Actualizar Precios/i }).click();

        await expect(page.getByRole('heading', { name: /Confirmar actualización de precios/i })).toBeVisible();
        await expect(page.locator('dd').filter({ hasText: /^Torre Norte$/ })).toBeVisible();
        await expect(page.locator('dd').filter({ hasText: /^\$1\.800 CLP$/ })).toBeVisible();
        await expect(page.getByText(/Este ajuste solo afectará a los bloques futuros disponibles de este edificio\./i)).toBeVisible();

        await page.getByRole('button', { name: /Cancelar/i }).click();

        await expect(page.getByRole('heading', { name: /Confirmar actualización de precios/i })).toHaveCount(0);
        expect(updateRequestCount).toBe(0);
    });

    test('sends the selected building and price only after the admin confirms', async ({ page }) => {
        let payload: { buildingId?: string; newPrice?: number } | null = null;

        await mockAdminLogin(page);

        await page.route('**/api/buildings**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        { id: 'building-2', name: 'Torre Sur' },
                    ],
                }),
            });
        });

        await page.route('**/api/admin/prices', async (route) => {
            payload = await route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, updatedCount: 7 }),
            });
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        await page.goto('/admin/settings');
        await expect(page.getByRole('heading', { name: /Configuración/i })).toBeVisible();
        await page.locator('select').selectOption('building-2');
        await page.getByRole('spinbutton').fill('2500');
        await page.getByRole('button', { name: /Actualizar Precios/i }).click();
        await page.getByRole('button', { name: /Confirmar actualización/i }).click();

        expect(payload).toEqual({ buildingId: 'building-2', newPrice: 2500 });
        await expect(page.getByText(/Precios actualizados: 7 bloques afectados/i)).toBeVisible();
    });
});