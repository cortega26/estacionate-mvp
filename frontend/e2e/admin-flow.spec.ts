
import { test, expect } from '@playwright/test';

test.describe('Admin User Management Flow', () => {
    // Valid seeded resident (reset by db:seed)
    const targetUser = {
        email: 'resident@estacionate.cl',
        password: 'password123',
    };

    const adminUser = {
        email: 'admin@estacionate.cl',
        password: 'password123'
    };

    test('should allow admin to ban and unban a user', async ({ page }) => {
        test.setTimeout(120000);
        // --- STEP 1: ADMIN LOGIN ---
        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill(adminUser.email);
        await page.getByLabel(/Contraseña/i).fill(adminUser.password);
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        // --- STEP 2: BAN USER ---
        // Navigate to User Management
        await page.goto('/admin/users');

        // Search for user
        await page.getByPlaceholder('Search email or phone...').fill(targetUser.email);

        // Wait for table to filter
        await expect(page.getByText(targetUser.email)).toBeVisible();

        const row = page.getByRole('row').filter({ hasText: targetUser.email });

        // Ensure user is initially Active (from seed)
        await expect(row.getByText('Active')).toBeVisible();

        // Click Ban (Handle dialog)
        page.on('dialog', dialog => dialog.accept());
        await row.getByRole('button', { name: 'Ban' }).click();

        // Verify Status Change
        await expect(row.getByText('Banned')).toBeVisible();

        // --- STEP 3: VERIFY BAN (USER LOGIN FAIL) ---
        // Logout via clearing cookies to ensure clean state
        await page.context().clearCookies();
        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill(targetUser.email);
        await page.getByLabel(/Contraseña/i).fill(targetUser.password);
        await page.getByRole('button', { name: /Ingresar/i }).click();

        // Expect Failure (Toast or Error Message)
        // Matches "Falló", "Banned", "Suspendida", or generic "Error"
        await expect(page.getByText(/Falló|Banned|Suspendida|Error/i)).toBeVisible();

        // Ensure NOT redirected to dashboard
        await expect(page).not.toHaveURL(/\/search/);


        // --- STEP 4: UNBAN USER ---
        await page.context().clearCookies();

        // Login Admin Again
        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill(adminUser.email);
        await page.getByLabel(/Contraseña/i).fill(adminUser.password);
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await page.goto('/admin/users');
        await page.getByPlaceholder('Search email or phone...').fill(targetUser.email);

        const rowUnban = page.getByRole('row').filter({ hasText: targetUser.email });
        await expect(rowUnban.getByText('Banned')).toBeVisible();

        // Click Unban
        await rowUnban.getByRole('button', { name: 'Unban' }).click();
        await expect(rowUnban.getByText('Active')).toBeVisible();


        // --- STEP 5: VERIFY UNBAN (USER LOGIN SUCCESS) ---
        await page.context().clearCookies();
        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill(targetUser.email);
        await page.getByLabel(/Contraseña/i).fill(targetUser.password);
        await page.getByRole('button', { name: /Ingresar/i }).click();

        // Expect Success
        await expect(page).toHaveURL(/\/(search|dashboard)/);
    });
});
