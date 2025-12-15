// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchPage } from '../SearchPage';
import { useAuthStore } from '../../../store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../lib/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

const queryClient = new QueryClient();

const renderComponent = () => {
    return render(
        <QueryClientProvider client={queryClient}>
            <SearchPage />
        </QueryClientProvider>
    );
};

describe('SearchPage', () => {
    beforeEach(() => {
        // Reset store
        useAuthStore.setState({ user: null, token: null });
    });

    it('shows loading when user is missing', () => {
        renderComponent();
        expect(screen.getByText(/Cargando usuario/i)).toBeInTheDocument();
    });

    it('renders search interface when user is present', () => {
        useAuthStore.setState({
            user: {
                id: '1',
                email: 'test@test.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'resident',
                isVerified: true
            },
            token: 'fake-token'
        });

        renderComponent();
        expect(screen.getByText(/Buscar Estacionamiento/i)).toBeInTheDocument();
    });
});
