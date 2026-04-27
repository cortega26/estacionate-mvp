import { expect, test } from './playwright.js';

test.describe('Admin Dashboard Reporting Clarity', () => {
    test('explains scope and next steps when reporting data is empty', async ({ page }) => {
        const emptyStats = {
            revenue: 0,
            activeBookings: 0,
            totalSpots: 12,
            occupancyRate: '0.0',
            revenueOverTime: [
                { date: '2026-04-24', amount: 0 },
                { date: '2026-04-25', amount: 0 },
                { date: '2026-04-26', amount: 0 },
            ],
            recentActivity: [],
        };

        await page.route('**/api/admin/stats**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: emptyStats }),
            });
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);
        await expect(page.getByRole('heading', { name: /Resumen Global/i })).toBeVisible();
        await expect(page.getByText(/Viendo toda la plataforma/i)).toBeVisible();
        await expect(page.getByText(/Sin reservas activas por ahora/i)).toBeVisible();
        await expect(page.getByText(/Ingresos finalizados dentro del periodo reportado/i)).toBeVisible();
        await expect(page.getByText(/Pendientes y confirmadas que aún requieren seguimiento/i)).toBeVisible();
        await expect(page.getByText(/0 de 12 cupos ocupados ahora/i)).toBeVisible();
        await expect(page.getByText(/No hay ingresos finalizados en los últimos 30 días/i)).toBeVisible();
        await expect(page.getByText('No hay actividad reciente para revisar.', { exact: true })).toBeVisible();
    });

    test('keeps building admins inside their assigned dashboard scope', async ({ page, request }) => {
        const buildingScopedStats = {
            revenue: 125000,
            activeBookings: 2,
            totalSpots: 8,
            occupancyRate: '25.0',
            revenueOverTime: [
                { date: '2026-04-24', amount: 25000 },
                { date: '2026-04-25', amount: 40000 },
                { date: '2026-04-26', amount: 60000 },
            ],
            recentActivity: [
                {
                    id: 'bk-building-1',
                    status: 'confirmed',
                    amountClp: 18000,
                    user: {
                        firstName: 'Paula',
                        email: 'resident@estacionate.cl',
                    },
                    spot: {
                        spotNumber: 'B-12',
                    },
                },
            ],
        };

        await page.route('**/api/admin/stats**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: buildingScopedStats }),
            });
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('badmin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        const tokenCookie = (await page.context().cookies()).find((cookie) => cookie.name === 'token');
        expect(tokenCookie?.value).toBeTruthy();

        const forbiddenResponse = await request.get('http://localhost:3000/api/admin/stats?buildingId=00000000-0000-0000-0000-000000000000', {
            headers: {
                Cookie: `token=${tokenCookie?.value}`,
            },
        });
        const forbiddenBody = await forbiddenResponse.json();

        expect(forbiddenResponse.status()).toBe(403);
        expect(forbiddenBody.error).toMatch(/access denied to this building/i);

        await expect(page.getByRole('heading', { name: 'Panel de Administración' })).toBeVisible();
        await expect(page.getByText('Edificio Asignado', { exact: true })).toBeVisible();
        await expect(page.getByText(/Viendo solo tu edificio asignado/i)).toBeVisible();
        await expect(page.getByText(/La actividad reciente ya está disponible para seguimiento operacional/i)).toBeVisible();
        await expect(page.getByText(/2 de 8 cupos ocupados ahora/i)).toBeVisible();
        await expect(page.getByRole('heading', { name: /Resumen Global/i })).toHaveCount(0);
    });
});