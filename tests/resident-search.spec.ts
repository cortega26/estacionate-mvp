import { expect, test } from './playwright';

test.describe('Resident Search Flow', () => {
    test('allows a seeded resident to reach the search surface', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('resident@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/search/);
        await expect(page.getByRole('heading', { name: /Buscar Estacionamiento/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Buscar/i })).toBeVisible();
        await expect(page.getByText(/Encuentra y reserva tu lugar en segundos/i)).toBeVisible();
    });
});