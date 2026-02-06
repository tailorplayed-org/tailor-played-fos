import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import styles from './Loader.module.scss';

interface LoaderProps {
  /** Optional label shown below the animation */
  label?: string;
  /** Size of the loader animation in px (default: 120) */
  size?: number;
  /** Whether to render full-page centered or inline */
  fullPage?: boolean;
}

export function Loader({
  label,
  size = 120,
  fullPage = true,
}: LoaderProps) {
  const animation = (
    <div className={styles.loaderInner}>
      <DotLottieReact
        src="/Dice-home.lottie"
        loop
        autoplay
        style={{ width: size, height: size }}
      />
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className={styles.fullPage} role="status" aria-label={label ?? 'Loading'}>
        {animation}
      </div>
    );
  }

  return (
    <div className={styles.inline} role="status" aria-label={label ?? 'Loading'}>
      {animation}
    </div>
  );
}
