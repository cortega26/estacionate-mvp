import { expect, test } from './playwright';

test.describe('Resident Booking To Payment Journey', () => {
    test('moves from booking confirmation into payment simulator and back to a confirmed result', async ({ page }) => {
        const bookingId = '123e4567-e89b-12d3-a456-426614174000';
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

        const mockedSummary = {
            id: bookingId,
            status: 'confirmed',
            paymentStatus: 'paid',
            visitorName: 'Visita Demo',
            visitorPhone: '+56912345678',
            vehiclePlate: 'ABCD12',
            amountClp: 2500,
            confirmationCode: 'AB12CD34',
            specialInstructions: 'Park carefully',
            startDatetime: mockedSpot.startDatetime,
            endDatetime: mockedSpot.endDatetime,
            spotNumber: mockedSpot.spot.spotNumber,
            buildingName: mockedBuilding.name,
            buildingAddress: mockedBuilding.address,
        };

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

        await page.route('**/api/bookings/create', async (route) => {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    booking: { id: bookingId },
                    payment: {
                        init_point: `/payment-simulator?booking_id=${bookingId}&amount=2500`,
                    },
                }),
            });
        });

        await page.route('**/api/payments/webhook', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true }),
            });
        });

        await page.route(`**/api/bookings/summary?bookingId=${bookingId}`, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: mockedSummary }),
            });
        });

        await page.goto('/login');
        await page.getByLabel(/Correo/i).fill('resident@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/search/);
        await page.getByRole('button', { name: /Reservar Ahora/i }).click();

        await page.getByLabel(/Patente del Vehículo/i).fill('ABCD12');
        await page.getByLabel(/Nombre Visita/i).fill('Visita Demo');
        await page.getByLabel(/Teléfono/i).fill('+56912345678');
        await page.getByRole('button', { name: /Ir a Pagar/i }).click();

        await expect(page).toHaveURL(/\/payment-simulator\?booking_id=/);
        await expect(page.getByText(/Simulador MercadoPago/i)).toBeVisible();
        await page.getByRole('button', { name: /Simular Éxito/i }).click();

        await expect(page).toHaveURL(/\/pago\/exito\?booking_id=.*status=approved/);
        await expect(page.getByRole('heading', { name: /Reserva confirmada/i })).toBeVisible();
        await expect(page.getByText(mockedSummary.confirmationCode)).toBeVisible();
        await expect(page.getByText(mockedSummary.visitorName)).toBeVisible();
        await expect(page.getByText(/Patente: ABCD12/i)).toBeVisible();
        await expect(page.getByText(/Muestra tu código de confirmación al ingresar/i)).toBeVisible();
    });
});