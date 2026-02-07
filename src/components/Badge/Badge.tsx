import styles from './Badge.module.scss';

export type BadgeColor = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface BadgeProps {
  label: string;
  color?: BadgeColor;
  className?: string;
}

const COLOR_CLASS_MAP: Record<BadgeColor, string> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  default: 'colorDefault',
};

export function Badge({ label, color = 'default', className }: BadgeProps) {
  const classNames = [styles.badge, styles[COLOR_CLASS_MAP[color]], className]
    .filter(Boolean)
    .join(' ');

  return <span className={classNames}>{label}</span>;
}
