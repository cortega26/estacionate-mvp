import { expect, test } from './playwright';

test.describe('Authentication Smoke', () => {
    test('shows an error on invalid login', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('wrong@test.com');
        await page.getByLabel(/Contraseña/i).fill('wrongpass');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible();
    });

    test('logs in successfully as seeded admin', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);
    });
});