import { expect, test } from './playwright';

test.describe('Admin User Management', () => {
    const targetUser = {
        email: 'resident@estacionate.cl',
        password: 'password123',
    };

    const adminUser = {
        email: 'admin@estacionate.cl',
        password: 'password123',
    };

    test('allows admin to ban and unban a seeded resident', async ({ page }) => {
        test.setTimeout(120000);
        page.on('dialog', (dialog) => dialog.accept());

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill(adminUser.email);
        await page.getByLabel(/Contraseña/i).fill(adminUser.password);
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        await page.goto('/admin/users');
        await page.getByPlaceholder('Search email or phone...').fill(targetUser.email);
        await expect(page.getByText(targetUser.email)).toBeVisible();

        const activeRow = page.getByRole('row').filter({ hasText: targetUser.email });

        const unbanButton = activeRow.getByRole('button', { name: 'Unban' });
        if (await unbanButton.count()) {
            await unbanButton.click();
        }

        await expect(activeRow.getByText('Active')).toBeVisible();
        await activeRow.getByRole('button', { name: 'Ban' }).click();
        await expect(activeRow.getByText('Banned')).toBeVisible();

        await page.context().clearCookies();
        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill(targetUser.email);
        await page.getByLabel(/Contraseña/i).fill(targetUser.password);
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page.getByText(/Cuenta inactiva|Falló|Banned|Suspendida|Error/i)).toBeVisible();
        await expect(page).not.toHaveURL(/\/search/);

        await page.context().clearCookies();
        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill(adminUser.email);
        await page.getByLabel(/Contraseña/i).fill(adminUser.password);
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);
        await page.goto('/admin/users');
        await page.getByPlaceholder('Search email or phone...').fill(targetUser.email);

        const bannedRow = page.getByRole('row').filter({ hasText: targetUser.email });
        await expect(bannedRow.getByText('Banned')).toBeVisible();
        await bannedRow.getByRole('button', { name: 'Unban' }).click();
        await expect(bannedRow.getByText('Active')).toBeVisible();
    });
});