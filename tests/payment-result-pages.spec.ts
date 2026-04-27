import { expect, test } from './playwright';

test.describe('Payment Result Pages', () => {
    test('shows richer guidance on approved payments', async ({ page }) => {
        await page.goto('/pago/exito?booking_id=123e4567-e89b-12d3-a456-426614174000&status=approved');

        await expect(page.getByRole('heading', { name: /Reserva confirmada/i })).toBeVisible();
        await expect(page.getByText(/Ref: 123e4567-e89b-12d3-a456-426614174000/i)).toBeVisible();
        await expect(page.getByText(/Muestra tu código de confirmación al ingresar/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Volver a buscar/i })).toBeVisible();
    });

    test('shows pending payment guidance', async ({ page }) => {
        await page.goto('/pago/exito?booking_id=123e4567-e89b-12d3-a456-426614174000&pending=true&status=pending');

        await expect(page.getByRole('heading', { name: /Pago pendiente/i })).toBeVisible();
        await expect(page.getByText(/esperando la confirmación final/i).first()).toBeVisible();
        await expect(page.getByText(/Si el cobro no se confirma en unos minutos/i)).toBeVisible();
    });

    test('shows retry guidance on rejected payments', async ({ page }) => {
        await page.goto('/pago/fallido?booking_id=123e4567-e89b-12d3-a456-426614174000&status=rejected&reason=simulated_rejection');

        await expect(page.getByRole('heading', { name: /Pago no completado/i })).toBeVisible();
        await expect(page.getByText(/rechazado en la simulación/i)).toBeVisible();
        await expect(page.getByText(/Vuelve a la app y repite la reserva/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Intentar nuevamente/i })).toBeVisible();
    });
});