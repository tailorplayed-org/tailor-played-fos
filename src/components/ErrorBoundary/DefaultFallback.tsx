import { useTranslation } from 'react-i18next';
import styles from './ErrorBoundary.module.scss';

interface DefaultFallbackProps {
  error: Error | null;
  onReset: () => void;
}

/** Default fallback UI for ErrorBoundary — uses useTranslation for i18n. */
export function DefaultFallback({ error, onReset }: DefaultFallbackProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.fallback}>
      <h2 className={styles.title}>{t('components.errorBoundary.title')}</h2>
      <p className={styles.description}>
        {t('components.errorBoundary.description')}
      </p>
      {import.meta.env.DEV && error && (
        <pre className={styles.details}>
          {error.message}
        </pre>
      )}
      <button
        type="button"
        className={styles.retryButton}
        onClick={onReset}
      >
        {t('components.errorBoundary.tryAgain')}
      </button>
    </div>
  );
}
