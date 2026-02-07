import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '@/stores/useUIStore';
import { Toast } from './Toast';
import styles from './Toast.module.scss';

const AUTO_DISMISS_MS: Record<string, number | null> = {
  success: 3000,
  info: 3000,
  error: 5000,
  warning: null, // persistent
};

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    toasts.forEach((t) => {
      if (timers.current.has(t.id)) return;
      const ms = AUTO_DISMISS_MS[t.type];
      if (ms !== null && ms !== undefined) {
        const timer = setTimeout(() => {
          removeToast(t.id);
          timers.current.delete(t.id);
        }, ms);
        timers.current.set(t.id, timer);
      }
    });

    // Cleanup removed toasts
    const currentIds = new Set(toasts.map((t) => t.id));
    timers.current.forEach((timer, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    });
  }, [toasts, removeToast]);

  // Cleanup all timers on unmount
  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const visible = toasts.slice(-3);

  if (visible.length === 0) return null;

  return createPortal(
    <div className={styles.container} aria-live="polite">
      {visible.map((t) => (
        <Toast key={t.id} toast={t} onClose={removeToast} />
      ))}
    </div>,
    document.body
  );
}
