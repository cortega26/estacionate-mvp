import { expect, test } from './playwright';

const readPersistedUser = async (page: any) => page.evaluate(() => {
    const raw = window.localStorage.getItem('auth-storage');

    if (!raw) {
        return null;
    }

    return JSON.parse(raw).state?.user ?? null;
});

const submitLogin = async (page: any, email: string, password: string) => {
    await page.getByLabel(/Correo/i).fill(email);
    await page.getByLabel(/Contraseña/i).fill(password);
    await page.getByRole('button', { name: /Ingresar/i }).click();
};

const expectLoginFeedback = async (page: any, message: RegExp) => {
    await expect(page.getByText(message)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
};

const mockSearchBootstrap = async (page: any) => {
    await page.route('**/api/buildings', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                data: [
                    {
                        id: 'building-1',
                        name: 'Demo Building',
                        address: 'Demo 123',
                    },
                ],
            }),
        });
    });

    await page.route('**/api/spots/search**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [] }),
        });
    });
};

const mockAdminDashboardBootstrap = async (page: any) => {
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
};

const mockConciergeBootstrap = async (page: any) => {
    await page.route('**/api/concierge/dashboard', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [] }),
        });
    });
};

const mockSalesBootstrap = async (page: any) => {
    await page.route('**/api/sales/dashboard', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                totalEarnings: 0,
                monthlyEarnings: 0,
                activeBuildingsCount: 0,
                recentCommissions: [],
            }),
        });
    });

    await page.route('**/api/sales/buildings', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });
};

test.describe('Authentication Smoke', () => {
    test('shows an error on invalid login', async ({ page }) => {
        await page.goto('/login');

        await submitLogin(page, 'wrong@test.com', 'wrongpass');

        await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible();
    });

    test('shows unverified-account feedback for the seeded resident', async ({ page }) => {
        await page.goto('/login');

        await submitLogin(page, 'resident-unverified@estacionate.cl', 'password123');

        await expectLoginFeedback(page, /Cuenta no verificada\. Revise su correo o contacte a administración\./i);
    });

    test('shows inactive-account feedback for the seeded resident', async ({ page }) => {
        await page.goto('/login');

        await submitLogin(page, 'resident-inactive@estacionate.cl', 'password123');

        await expectLoginFeedback(page, /Cuenta inactiva\. Contacte a administración para reactivarla\./i);
    });

    test('shows lockout feedback after repeated invalid logins for the seeded resident', async ({ page }) => {
        // Mock login to simulate rate-limiting without requiring Redis
        let attemptCount = 0;
        await page.route('**/api/auth/login', async (route) => {
            attemptCount++;
            if (attemptCount >= 5) {
                await route.fulfill({
                    status: 429,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        code: 'AUTH-LOGIN-1002',
                        message: 'Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos.',
                        error: 'Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos.',
                    }),
                });
            } else {
                await route.fulfill({
                    status: 401,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        code: 'AUTH-LOGIN-1001',
                        message: 'Credenciales inválidas',
                        error: 'Credenciales inválidas',
                    }),
                });
            }
        });

        await page.goto('/login');

        for (let attempt = 0; attempt < 6; attempt += 1) {
            await submitLogin(page, 'resident-lockout@estacionate.cl', 'wrongpass');

            await expect(page.getByText(/Cuenta bloqueada temporalmente\. Intente nuevamente en 15 minutos\.|Credenciales inválidas/i).last()).toBeVisible();

            if (await page.getByText(/Cuenta bloqueada temporalmente\. Intente nuevamente en 15 minutos\./i).last().isVisible()) {
                break;
            }
        }

        await expectLoginFeedback(page, /Cuenta bloqueada temporalmente\. Intente nuevamente en 15 minutos\./i);
    });

    test('logs in successfully as seeded admin', async ({ page }) => {
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
        await mockAdminDashboardBootstrap(page);
        await mockSearchBootstrap(page);

        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('admin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);

        const persistedUser = await readPersistedUser(page);
        expect(persistedUser).toMatchObject({
            email: 'admin@estacionate.cl',
            firstName: '',
            lastName: '',
            isVerified: true,
            role: 'admin',
            isAuthenticated: true,
        });

        await page.goto('/search');
        await expect(page.locator('header')).toContainText('admin@estacionate.cl');
    });

    test('logs in successfully as seeded building admin with scoped auth state', async ({ page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    user: {
                        id: 'badmin-1',
                        email: 'badmin@estacionate.cl',
                        firstName: '',
                        lastName: '',
                        isVerified: true,
                        role: 'building_admin',
                        buildingId: 'building-1',
                        isAuthenticated: true,
                    },
                }),
            });
        });
        await mockAdminDashboardBootstrap(page);

        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('badmin@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);
        await expect(page.locator('aside')).toContainText('Admin Edificio');

        const persistedUser = await readPersistedUser(page);
        expect(persistedUser).toMatchObject({
            email: 'badmin@estacionate.cl',
            role: 'building_admin',
            buildingId: 'building-1',
            isAuthenticated: true,
        });
    });

    test('logs in successfully as seeded resident with the normalized profile payload', async ({ page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    user: {
                        id: 'resident-1',
                        email: 'resident@estacionate.cl',
                        firstName: 'Demo',
                        lastName: 'Resident',
                        isVerified: true,
                        role: 'resident',
                        buildingId: 'building-1',
                        isAuthenticated: true,
                    },
                }),
            });
        });
        await mockSearchBootstrap(page);

        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('resident@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/search/);
    await expect(page.locator('header')).toContainText('Demo');

        const persistedUser = await readPersistedUser(page);
        expect(persistedUser).toMatchObject({
            email: 'resident@estacionate.cl',
            firstName: 'Demo',
            lastName: 'Resident',
            isVerified: true,
            role: 'resident',
            isAuthenticated: true,
        });
    });

    test('routes sales reps to the sales dashboard with a stable identity fallback', async ({ page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    user: {
                        id: 'sales-1',
                        email: 'sales@estacionate.cl',
                        firstName: '',
                        lastName: '',
                        isVerified: true,
                        role: 'sales_rep',
                        isAuthenticated: true,
                    },
                }),
            });
        });
        await mockSalesBootstrap(page);

        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('sales@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/sales/);
        await expect(page.locator('aside')).toContainText('sales@estacionate.cl');

        const persistedUser = await readPersistedUser(page);
        expect(persistedUser).toMatchObject({
            email: 'sales@estacionate.cl',
            firstName: '',
            lastName: '',
            isVerified: true,
            role: 'sales_rep',
            isAuthenticated: true,
        });
    });

    test('routes concierges to the gatekeeper dashboard with the normalized auth payload', async ({ page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    user: {
                        id: 'concierge-1',
                        email: 'concierge@estacionate.cl',
                        firstName: '',
                        lastName: '',
                        isVerified: true,
                        role: 'concierge',
                        buildingId: 'building-1',
                        isAuthenticated: true,
                    },
                }),
            });
        });
        await mockConciergeBootstrap(page);

        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('concierge@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/gatekeeper/);
        await expect(page.locator('header')).toContainText('concierge@estacionate.cl');

        const persistedUser = await readPersistedUser(page);
        expect(persistedUser).toMatchObject({
            email: 'concierge@estacionate.cl',
            role: 'concierge',
            buildingId: 'building-1',
            isAuthenticated: true,
        });
    });

    test('routes support staff to the admin dashboard instead of the resident search flow', async ({ page }) => {
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    user: {
                        id: 'support-1',
                        email: 'support@estacionate.cl',
                        firstName: '',
                        lastName: '',
                        isVerified: true,
                        role: 'support',
                        isAuthenticated: true,
                    },
                }),
            });
        });
        await mockAdminDashboardBootstrap(page);

        await page.goto('/login');

        await page.getByLabel(/Correo/i).fill('support@estacionate.cl');
        await page.getByLabel(/Contraseña/i).fill('password123');
        await page.getByRole('button', { name: /Ingresar/i }).click();

        await expect(page).toHaveURL(/\/admin/);
        await expect(page.locator('aside')).toContainText('Soporte');

        const persistedUser = await readPersistedUser(page);
        expect(persistedUser).toMatchObject({
            email: 'support@estacionate.cl',
            firstName: '',
            lastName: '',
            isVerified: true,
            role: 'support',
            isAuthenticated: true,
        });
    });
});