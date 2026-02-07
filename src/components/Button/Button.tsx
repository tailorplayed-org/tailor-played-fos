import { type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  shortcut?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  shortcut,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        <>
          <span className={styles.label}>{children}</span>
          {shortcut && (
            <kbd className={styles.shortcut}>{shortcut}</kbd>
          )}
        </>
      )}
    </button>
  );
}
