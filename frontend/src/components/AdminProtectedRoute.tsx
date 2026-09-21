import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { LoadingState } from './ui/States';

export function AdminProtectedRoute() {
  const { admin, isLoading } = useAdminAuth();

  if (isLoading) return <LoadingState label="Checking admin session..." />;
  if (!admin) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}
