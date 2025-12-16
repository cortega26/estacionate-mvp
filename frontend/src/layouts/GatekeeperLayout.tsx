import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const GatekeeperLayout = () => {
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        if (user?.role !== 'concierge') {
            navigate('/search'); // Kick out non-gatekeepers
        }
    }, [isAuthenticated, user, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Mobile Header */}
            <header className="bg-slate-800 p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Estacionate <span className="text-emerald-400">Gate</span></h1>
                    <p className="text-xs text-slate-400">
                        {user?.email}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 px-4 rounded-lg transition-colors border border-slate-600"
                >
                    Salir
                </button>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto bg-slate-900 pb-20">
                <div className="max-w-md mx-auto p-4 w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
