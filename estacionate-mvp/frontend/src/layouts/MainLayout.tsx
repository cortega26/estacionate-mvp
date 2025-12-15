import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const MainLayout = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-indigo-600 tracking-tight">
                                Estacionate
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {user && (
                                <div className="text-sm text-gray-700 hidden sm:block">
                                    <span className="text-gray-400">Hola,</span> {user.firstName}
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                <Outlet />
            </main>
        </div>
    );
};
