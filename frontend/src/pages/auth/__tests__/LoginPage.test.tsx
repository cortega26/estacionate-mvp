// @vitest-environment jsdom
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../LoginPage';

const mockPost = vi.fn();
const mockToastError = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../lib/api', () => ({
    api: {
        post: (...args: unknown[]) => mockPost(...args)
    }
}));

vi.mock('react-hot-toast', () => ({
    default: {
        error: (...args: unknown[]) => mockToastError(...args),
        success: vi.fn()
    }
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

const renderLoginPage = () => {
    return render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>
    );
};

const submitLogin = async () => {
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Correo Electrónico/i), 'resident@estacionate.cl');
    await user.type(screen.getByLabelText(/Contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Ingresar/i }));
};

describe('LoginPage', () => {
    beforeEach(() => {
        mockPost.mockReset();
        mockToastError.mockReset();
        mockNavigate.mockReset();
    });

    it.each([
        {
            code: 'AUTH-LOGIN-1002',
            apiMessage: 'Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos.',
            expectedToast: 'Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos.'
        },
        {
            code: 'AUTH-LOGIN-1003',
            apiMessage: 'Cuenta no verificada. Por favor revise su correo o contacte a administración.',
            expectedToast: 'Cuenta no verificada. Revise su correo o contacte a administración.'
        },
        {
            code: 'AUTH-LOGIN-1004',
            apiMessage: 'Cuenta inactiva',
            expectedToast: 'Cuenta inactiva. Contacte a administración para reactivarla.'
        }
    ])('shows tailored feedback for login code $code', async ({ code, apiMessage, expectedToast }) => {
        mockPost.mockRejectedValue({
            response: {
                data: {
                    code,
                    publicMessage: apiMessage,
                    error: apiMessage
                }
            }
        });

        renderLoginPage();

        await submitLogin();

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith(expectedToast);
        });
    });

    it('falls back to the backend public message for unmapped login failures', async () => {
        mockPost.mockRejectedValue({
            response: {
                data: {
                    code: 'AUTH-LOGIN-1999',
                    publicMessage: 'Credenciales inválidas'
                }
            }
        });

        renderLoginPage();

        await submitLogin();

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith('Credenciales inválidas');
        });
    });
});