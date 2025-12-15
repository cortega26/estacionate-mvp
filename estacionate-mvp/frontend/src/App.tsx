import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { useAuthStore } from './store/authStore';

// Pages
import { SearchPage } from './pages/Dashboard/SearchPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { SignupPage } from './pages/Auth/SignupPage';
import { SuccessPage } from './pages/Checkout/SuccessPage';
import { FailurePage } from './pages/Checkout/FailurePage';
import { DashboardPage } from './pages/Admin/DashboardPage';
import { SettingsPage } from './pages/Admin/SettingsPage';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { MainLayout } from './layouts/MainLayout';

const ProtectedLayout = () => {
  const token = useAuthStore((state) => state.token);
  return token ? <Outlet /> : <Navigate to="/login" />;
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
          <Route path="/checkout/success" element={<SuccessPage />} />
          <Route path="/checkout/failure" element={<FailurePage />} />

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
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
