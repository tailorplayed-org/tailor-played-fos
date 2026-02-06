import { Navigate, Outlet } from 'react-router';
import { useAuth } from './hooks/useAuth';
import styles from './AuthGuard.module.scss';

export function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
