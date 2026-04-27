import { expect, test } from './playwright';

test.describe('Guard Validation Flow', () => {
    test('routes plate and confirmation code lookups with the expected payloads', async ({ page }) => {
        const verificationPayloads: Array<Record<string, string>> = [];

        await page.route('**/api/concierge/dashboard', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [] }),
            });
        });

        await page.route('**/api/concierge/verify', async (route) => {
            verificationPayloads.push(route.request().postDataJSON() as Record<string, string>);

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        id: `booking-${verificationPayloads.length}`,
                        plate: verificationPayloads.at(-1)?.plate || 'ABCD12',
                        visitorName: 'Visita Demo',
                        spotNumber: 'B-12',
                        resident: 'Demo Resident',
                        expiresAt: '2026-04-26T18:30:00.000Z',
                    },
                }),
            });
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('concierge@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/gatekeeper/);
        await expect(page.getByText(/codigo de confirmacion de 8 caracteres/i)).toBeVisible();

        const verificationInput = page.getByPlaceholder('ABCD-12');

        await verificationInput.fill('abcd12');
        await page.getByRole('button', { name: 'VERIFICAR' }).click();

        await expect.poll(() => verificationPayloads[0]).toEqual({ plate: 'ABCD12' });
        await expect(page.getByText(/ACCESO AUTORIZADO/i)).toBeVisible();

        await verificationInput.fill('a1b2c3d4');
        await page.getByRole('button', { name: 'VERIFICAR' }).click();

        await expect.poll(() => verificationPayloads[1]).toEqual({ code: 'A1B2C3D4' });
    });
});