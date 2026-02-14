import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { WarningCircle, X } from '@phosphor-icons/react';
import { formatCurrency } from '@/lib';
import styles from './OsPaturBanner.module.scss';

const DISMISS_KEY = 'osPaturBannerDismissed';

interface OsPaturBannerProps {
  osPaturPercent: number;
  thresholdAgora: number;
}

export function OsPaturBanner({ osPaturPercent, thresholdAgora }: OsPaturBannerProps) {
  const { t } = useTranslation();

  // Dismiss with sessionStorage — reappears on next login/session
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // sessionStorage may be unavailable in some contexts
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className={styles.banner} role="alert">
      <WarningCircle size={24} weight="fill" className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.message}>
          {t('dashboard.osPatur.warning', {
            percent: String(osPaturPercent),
            threshold: formatCurrency(thresholdAgora, 'ILS'),
          })}
        </p>
        <p className={styles.advice}>{t('dashboard.osPatur.advice')}</p>
      </div>
      <button
        onClick={handleDismiss}
        className={styles.dismiss}
        aria-label={t('dashboard.osPatur.dismiss')}
      >
        <X size={18} />
      </button>
    </div>
  );
}
