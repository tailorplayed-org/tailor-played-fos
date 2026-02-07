import { Navigate, Outlet } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { Loader } from '@/components/Loader';

export function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
