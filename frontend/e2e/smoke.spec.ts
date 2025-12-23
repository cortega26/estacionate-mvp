import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {

    test('should show error on invalid login', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('wrong@test.com');
        await page.getByLabel(/Contraseña/i).fill('wrongpass');

        await page.getByRole('button', { name: /Ingresar/i }).click();

        // Expect error toast
        await expect(page.getByText('Falló el inicio de sesión')).toBeVisible();
    });

    test('should login successfully as admin', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');

        await page.getByRole('button', { name: /Ingresar/i }).click();

        // Verify redirection to Admin Dashboard
        await expect(page).toHaveURL(/.*admin/);

        // Verify basic admin page element (assuming sidebar or header exists)
        // If unsure, URL check is a good first step for smoke test
    });

});
