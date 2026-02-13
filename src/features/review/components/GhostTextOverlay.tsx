import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GhostTextCard } from './GhostTextCard';
import type { GhostTextCardProps } from './GhostTextCard';
import styles from './GhostTextOverlay.module.scss';

export interface GhostTextOverlayProps extends GhostTextCardProps {
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function GhostTextOverlay({
  onClose,
  ...cardProps
}: GhostTextOverlayProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus trap: cycle focus within the card
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = cardRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!focusableElements || focusableElements.length === 0) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift+Tab on first → go to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab on last → go to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [],
  );

  // Auto-focus the first button (Confirm) when overlay opens
  useEffect(() => {
    const focusableElements = cardRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay background, not the card
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      data-testid="ghost-text-overlay"
    >
      <div ref={cardRef} className={styles.cardContainer}>
        <GhostTextCard {...cardProps} />
      </div>
    </div>,
    document.body,
  );
}
