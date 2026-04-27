import { expect, test } from './playwright';

test.describe('Resident Search Flow', () => {
    test('shows booking details before sending the resident to payment', async ({ page }) => {
        const mockedBuilding = {
            id: 'building-demo',
            name: 'Torres del Parque (Demo)',
            address: 'Av. Kennedy 1234',
            contactEmail: 'admin@torres.cl',
            totalUnits: 100,
            visitorSpotsCount: 5,
            timezone: 'America/Santiago',
        };

        const mockedSpot = {
            id: 'block-demo',
            spotId: 'spot-demo',
            startDatetime: '2026-04-27T08:00:00.000Z',
            endDatetime: '2026-04-27T19:00:00.000Z',
            durationType: 'ELEVEN_HOURS',
            basePriceClp: 2500,
            status: 'available',
            spot: {
                id: 'spot-demo',
                spotNumber: 'V-01',
            },
        };

        const expectedDate = new Intl.DateTimeFormat('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        }).format(new Date(mockedSpot.startDatetime));

        const timeFormatter = new Intl.DateTimeFormat('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const expectedTimeRange = `${timeFormatter.format(new Date(mockedSpot.startDatetime))} - ${timeFormatter.format(new Date(mockedSpot.endDatetime))}`;

        await page.route('**/api/buildings', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [mockedBuilding] }),
            });
        });

        await page.route('**/api/spots/search**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [mockedSpot] }),
            });
        });

        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('resident@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/search/);
        await page.getByRole('button', { name: /Reservar Ahora/i }).click();

        const bookingForm = page.locator('form').last();

        await expect(page.getByRole('heading', { name: /Confirmar Reserva/i })).toBeVisible();
        await expect(bookingForm.getByText('Resumen antes de pagar', { exact: true })).toBeVisible();
        await expect(bookingForm.getByText(mockedBuilding.name, { exact: true })).toBeVisible();
        await expect(bookingForm.getByText(mockedBuilding.address, { exact: true })).toBeVisible();
        await expect(bookingForm.getByText(expectedDate, { exact: true })).toBeVisible();
        await expect(bookingForm.getByText(expectedTimeRange, { exact: true })).toBeVisible();
        await expect(bookingForm.getByText(/Duracion: 11 horas/i)).toBeVisible();
        await expect(bookingForm.getByText(/te redirigiremos a Mercado Pago/i)).toBeVisible();
    });

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