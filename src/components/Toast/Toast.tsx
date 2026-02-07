import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Warning, Info, X } from '@phosphor-icons/react';
import type { ToastData } from '@/stores/useUIStore';
import styles from './Toast.module.scss';

const ICON_MAP = {
  success: CheckCircle,
  error: XCircle,
  warning: Warning,
  info: Info,
} as const;

export interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

export function Toast({ toast: toastData, onClose }: ToastProps) {
  const { t } = useTranslation();
  const Icon = ICON_MAP[toastData.type];

  return (
    <div
      className={[styles.toast, styles[toastData.type]].filter(Boolean).join(' ')}
      role="listitem"
    >
      <Icon className={styles.icon} size={22} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.message}>{toastData.message}</span>
        {toastData.action && (
          <button
            type="button"
            className={styles.action}
            onClick={toastData.action.onClick}
          >
            {toastData.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className={styles.close}
        onClick={() => onClose(toastData.id)}
        aria-label={t('components.toast.close')}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
