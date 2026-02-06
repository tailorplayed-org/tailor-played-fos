import { useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import styles from './LoginScreen.module.scss';

export function LoginScreen() {
  const { user, loading, signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.spinner} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signIn();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setError(message);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>TailorPlayed</h1>
        <p className={styles.subtitle}>Financial Operations System</p>

        <button
          className={styles.signInButton}
          onClick={handleSignIn}
          disabled={signingIn}
          type="button"
        >
          {signingIn ? (
            <span className={styles.buttonSpinner} aria-hidden="true" />
          ) : null}
          {signingIn ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
