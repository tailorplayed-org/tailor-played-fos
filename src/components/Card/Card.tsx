import { type HTMLAttributes } from 'react';
import styles from './Card.module.scss';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  clickable?: boolean;
}

export function Card({
  clickable = false,
  children,
  className,
  onClick,
  ...props
}: CardProps) {
  const classNames = [
    styles.card,
    clickable ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}
