import styles from './Skeleton.module.scss';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: SkeletonVariant;
  className?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'text',
  className,
}: SkeletonProps) {
  const variantClass = variant === 'text' ? styles.text :
    variant === 'circle' ? styles.circle : styles.rect;

  const classNames = [styles.skeleton, variantClass, className]
    .filter(Boolean)
    .join(' ');

  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  return <div className={classNames} style={style} aria-hidden="true" />;
}
