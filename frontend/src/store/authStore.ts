import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    role: string;
    buildingId?: string;
}

interface AuthState {
    user: User | null;
    setAuth: (user: User) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            // token: null, // Removed for security
            setAuth: (user) => set({ user }),
            logout: () => {
                set({ user: null });
                // Call logout API to clear cookie
                import('../lib/api').then(({ api }) => api.post('/auth/logout').catch(console.error));
            },
            isAuthenticated: () => !!get().user,
        }),
        {
            name: 'auth-storage',
        }
    )
);
