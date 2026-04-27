import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

const noopStorage: StateStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
};

const resolveAuthStorage = (): StateStorage => {
    if (typeof window === 'undefined') {
        return noopStorage;
    }

    const storage = window.localStorage;

    if (
        storage &&
        typeof storage.getItem === 'function' &&
        typeof storage.setItem === 'function' &&
        typeof storage.removeItem === 'function'
    ) {
        return storage;
    }

    return noopStorage;
};

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    role: string;
    buildingId?: string;
    isAuthenticated: boolean;
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
            storage: createJSONStorage(resolveAuthStorage),
        }
    )
);
