import React, { useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const AdminLayout = () => {
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const normalizedRole = String(user?.role || '').toLowerCase();
    const isElevatedAdmin = normalizedRole === 'admin';
    const isSupport = normalizedRole === 'support';

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        if (!['admin', 'building_admin', 'support'].includes(normalizedRole)) {
            navigate('/search'); // Kick out non-admins
        }
    }, [isAuthenticated, normalizedRole, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin' },
        { name: 'Analytics', path: '/admin/analytics' },
        ...(isSupport ? [
            { name: 'Reservas', path: '/admin/bookings' },
        ] : []),
        ...(isElevatedAdmin ? [
            { name: 'Edificios', path: '/admin/buildings' },
            { name: 'Reservas', path: '/admin/bookings' },
            { name: 'Usuarios', path: '/admin/users' },
            { name: 'Vendedores', path: '/admin/sales-reps' }
        ] : []),
        ...(!isSupport ? [{ name: 'Configuración', path: '/admin/settings' }] : []),
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:block">
                <div className="p-6">
                    <h1 className="text-2xl font-bold">Admin Panel</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        {isElevatedAdmin ? 'Super Admin' : isSupport ? 'Soporte' : 'Admin Edificio'}
                    </p>
                </div>
                <nav className="mt-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`block py-3 px-6 hover:bg-slate-800 transition-colors ${location.pathname === item.path ? 'bg-slate-800 border-l-4 border-indigo-500' : ''
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <div className="mt-8 px-6 space-y-4">
                        <Link to="/search" className="block text-sm text-indigo-400 hover:text-indigo-300">
                            &larr; Volver a la App
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="block w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};
