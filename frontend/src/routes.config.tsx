import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

// Pages
import { SearchPage } from './pages/dashboard/SearchPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { PaymentSimulator } from './pages/PaymentSimulator';
import { SuccessPage } from './pages/checkout/SuccessPage';
import { FailurePage } from './pages/checkout/FailurePage';
import { TermsPage } from './pages/legal/TermsPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { BuildingsPage } from './pages/admin/BuildingsPage';
import Analytics from './pages/admin/Analytics';
import UserManagement from './pages/admin/UserManagement';
import SalesRepsPage from './pages/admin/SalesReps';
import { BookingManagement } from './pages/admin/BookingManagement';
import { GatekeeperDashboard } from './pages/gatekeeper/Dashboard';
import { SalesDashboard } from './pages/sales/SalesDashboard';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { MainLayout } from './layouts/MainLayout';
import { SalesLayout } from './layouts/SalesLayout';
import { GatekeeperLayout } from './layouts/GatekeeperLayout';
import { ProtectedLayout } from './components/ProtectedLayout';

export const routes: RouteObject[] = [
    // Public Routes
    { path: '/login', element: <LoginPage /> },
    { path: '/signup', element: <SignupPage /> },
    { path: '/forgot-password', element: <ForgotPasswordPage /> },
    { path: '/reset-password', element: <ResetPasswordPage /> },
    { path: '/checkout/success', element: <SuccessPage /> },
    { path: '/checkout/failure', element: <FailurePage /> },
    { path: '/terms', element: <TermsPage /> },
    { path: '/payment-simulator', element: <PaymentSimulator /> },

    // Resident (Protected)
    {
        element: <ProtectedLayout />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: '/search', element: <SearchPage /> },
                    { path: '/', element: <Navigate to="/search" replace /> }
                ]
            }
        ]
    },

    // Admin Routes
    {
        path: '/admin',
        element: <AdminLayout />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: 'analytics', element: <Analytics /> },
            { path: 'users', element: <UserManagement /> },
            { path: 'sales-reps', element: <SalesRepsPage /> },
            { path: 'buildings', element: <BuildingsPage /> },
            { path: 'bookings', element: <BookingManagement /> },
            { path: 'settings', element: <SettingsPage /> }
        ]
    },

    // Gatekeeper Routes
    {
        path: '/gatekeeper',
        element: <GatekeeperLayout />,
        children: [
            { index: true, element: <GatekeeperDashboard /> }
        ]
    },

    // Sales Rep Routes
    {
        path: '/sales',
        element: <SalesLayout />,
        children: [
            { index: true, element: <SalesDashboard /> }
        ]
    },

    // Fallback
    { path: '*', element: <Navigate to="/login" replace /> }
];
