import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedLayout = () => {
    const user = useAuthStore((state) => state.user);
    return user ? <Outlet /> : <Navigate to="/login" />;
};
