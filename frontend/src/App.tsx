import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { useAuthStore } from './store/authStore';

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
import { GatekeeperLayout } from './layouts/GatekeeperLayout';
import { GatekeeperDashboard } from './pages/gatekeeper/Dashboard';
import Analytics from './pages/admin/Analytics';
import UserManagement from './pages/admin/UserManagement';
// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { MainLayout } from './layouts/MainLayout';
import { SalesLayout } from './layouts/SalesLayout';
import { SalesDashboard } from './pages/sales/SalesDashboard';

const ProtectedLayout = () => {
  const user = useAuthStore((state) => state.user);
  return user ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  const queryClient = React.useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-center" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/checkout/success" element={<SuccessPage />} />
          <Route path="/checkout/failure" element={<FailurePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/payment-simulator" element={<PaymentSimulator />} />

          {/* Resident Protected Routes */}
          <Route element={<ProtectedLayout />}>
            <Route element={<MainLayout />}>
              <Route path="/search" element={<SearchPage />} />
              <Route path="/" element={<Navigate to="/search" replace />} />
            </Route>
          </Route>







          {/* Admin Routes (Layout handles protection) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="buildings" element={<BuildingsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>


          {/* Gatekeeper Routes */}
          <Route path="/gatekeeper" element={<GatekeeperLayout />}>
            <Route index element={<GatekeeperDashboard />} />
          </Route>

          {/* Sales Rep Routes */}
          <Route path="/sales" element={<SalesLayout />}>
            <Route index element={<SalesDashboard />} />
          </Route>


          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
