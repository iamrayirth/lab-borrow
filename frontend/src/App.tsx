import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ComponentsPage } from './pages/ComponentsPage';
import { ComponentDetailPage } from './pages/ComponentDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyComponentsPage } from './pages/MyComponentsPage';
import { ComponentFormPage } from './pages/ComponentFormPage';
import { MyRentalsPage } from './pages/MyRentalsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';

import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminComponentsPage } from './pages/admin/AdminComponentsPage';
import { AdminRentalsPage } from './pages/admin/AdminRentalsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

function StudentApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/components" element={<ComponentsPage />} />
          <Route path="/components/:id" element={<ComponentDetailPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/my-components" element={<MyComponentsPage />} />
            <Route path="/my-components/new" element={<ComponentFormPage />} />
            <Route path="/my-components/:id/edit" element={<ComponentFormPage />} />
            <Route path="/my-rentals" element={<MyRentalsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/components" element={<AdminComponentsPage />} />
            <Route path="/admin/rentals" element={<AdminRentalsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  return isAdminRoute ? <AdminApp /> : <StudentApp />;
}
