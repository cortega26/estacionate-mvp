import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { useAuthStore } from './store/authStore';

// Pages
import { SearchPage } from './pages/Dashboard/SearchPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { SignupPage } from './pages/Auth/SignupPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/Auth/ResetPasswordPage';
import { PaymentSimulator } from './pages/PaymentSimulator';
import { SuccessPage } from './pages/Checkout/SuccessPage';
import { FailurePage } from './pages/Checkout/FailurePage';
import { DashboardPage } from './pages/Admin/DashboardPage';
import { SettingsPage } from './pages/Admin/SettingsPage';
import { BuildingsPage } from './pages/Admin/BuildingsPage';
import { GatekeeperLayout } from './layouts/GatekeeperLayout';
import { GatekeeperDashboard } from './pages/Gatekeeper/Dashboard';
import Analytics from './pages/Admin/Analytics';
import UserManagement from './pages/Admin/UserManagement';
// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { MainLayout } from './layouts/MainLayout';

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
          <Route path="/payment-simulator" element={<PaymentSimulator />} />

          {/* Resident Protected Routes */}
          <Route element={<ProtectedLayout />}>
            <Route element={<MainLayout />}>
              <Route path="/search" element={<SearchPage />} />
              <Route path="/" element={<Navigate to="/search" replace />} />
            </Route>
          </Route>



          import Analytics from './pages/Admin/Analytics';
          import UserManagement from './pages/Admin/UserManagement';

          // ... (in Routes)

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

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
