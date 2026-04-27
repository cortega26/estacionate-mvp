import { expect, test } from './playwright';

test.describe('Admin User Management', () => {
    const targetUser = {
        id: 'resident-1',
        email: 'resident@estacionate.cl',
        role: 'resident',
    };

    test('allows admin to ban and unban a seeded resident', async ({ page }) => {
        let isUserActive = true;

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

        await page.route('**/api/admin/users**', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: [
                            {
                                id: targetUser.id,
                                email: targetUser.email,
                                role: targetUser.role,
                                isActive: isUserActive,
                                createdAt: '2026-04-27T00:00:00.000Z',
                                accountType: 'resident',
                                building: { name: 'Torre Norte' },
                            },
                        ],
                        pagination: {
                            page: 1,
                            totalPages: 1,
                        },
                    }),
                });
                return;
            }

            const payload = await route.request().postDataJSON();
            if (payload.action === 'ban') {
                isUserActive = false;
            }
            if (payload.action === 'unban') {
                isUserActive = true;
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

        await page.goto('/admin/users');
        await page.getByPlaceholder('Search email or phone...').fill(targetUser.email);
        await expect(page.getByText(targetUser.email)).toBeVisible();

        const activeRow = page.getByRole('row').filter({ hasText: targetUser.email });

        const unbanButton = activeRow.getByRole('button', { name: 'Unban' });
        if (await unbanButton.count()) {
            await unbanButton.click();
            await page.getByRole('button', { name: /Confirmar acción/i }).click();
        }

        await expect(activeRow.getByText('Active')).toBeVisible();
        await activeRow.getByRole('button', { name: 'Ban' }).click();
        await expect(page.getByRole('heading', { name: /Confirmar cambio de estado/i })).toBeVisible();
        await expect(page.getByRole('definition').filter({ hasText: new RegExp(`^${targetUser.email}$`, 'i') })).toBeVisible();
        await expect(page.getByRole('definition').filter({ hasText: /^ban$/i })).toBeVisible();
        await page.getByRole('button', { name: 'Cancelar' }).click();
        await expect(page.getByRole('heading', { name: /Confirmar cambio de estado/i })).toHaveCount(0);
        await expect(activeRow.getByText('Active')).toBeVisible();

        await activeRow.getByRole('button', { name: 'Ban' }).click();
        await page.getByRole('button', { name: /Confirmar acción/i }).click();
        await expect(activeRow.getByText('Banned')).toBeVisible();
        await page.goto('/admin/users');
        await page.getByPlaceholder('Search email or phone...').fill(targetUser.email);

        const bannedRow = page.getByRole('row').filter({ hasText: targetUser.email });
        await expect(bannedRow.getByText('Banned')).toBeVisible();
        await bannedRow.getByRole('button', { name: 'Unban' }).click();
        await expect(page.getByRole('heading', { name: /Confirmar cambio de estado/i })).toBeVisible();
        await expect(page.getByRole('definition').filter({ hasText: /^unban$/i })).toBeVisible();
        await page.getByRole('button', { name: /Confirmar acción/i }).click();
        await expect(bannedRow.getByText('Active')).toBeVisible();
    });
});