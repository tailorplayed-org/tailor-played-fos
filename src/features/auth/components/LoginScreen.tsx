import { useState } from 'react';
import { Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '@/components/Loader';
import styles from './LoginScreen.module.scss';

export function LoginScreen() {
  const { user, loading, signIn } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  if (loading) {
    return <Loader />;
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
      // Always show translated generic error to the user — Firebase SDK
      // errors are English-only and would break i18n in Hebrew mode.
      if (err instanceof Error) {
        console.error('Sign-in error:', err.message);
      }
      setError(t('auth.signInFailed'));
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img
          src="/images/full-logo.svg"
          alt="TailorPlayed"
          className={styles.logo}
        />
        <p className={styles.subtitle}>{t('auth.appTitle')}</p>

        <button
          className={styles.signInButton}
          onClick={handleSignIn}
          disabled={signingIn}
          type="button"
        >
          {signingIn ? (
            <span className={styles.buttonSpinner} aria-hidden="true" />
          ) : null}
          {signingIn ? t('auth.signingIn') : t('auth.signIn')}
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
