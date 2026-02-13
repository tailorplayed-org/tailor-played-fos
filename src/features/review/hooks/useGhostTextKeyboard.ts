import { useEffect, useRef } from 'react';

export interface UseGhostTextKeyboardOptions {
  /** Whether the Ghost Text Card overlay is currently visible */
  isOpen: boolean;
  /** Whether a confirmation is currently in progress */
  isConfirming?: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onReject: () => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Keyboard shortcut handler for the Ghost Text Card overlay.
 *
 * Registers `keydown` listener on `document` ONLY when the card is open.
 * Uses refs for callbacks to keep the listener stable across re-renders,
 * avoiding unnecessary listener detach/reattach churn.
 * Ignores key events originating from input, textarea, or select elements
 * (reserved for future Story 5.3 edit mode).
 */
export function useGhostTextKeyboard({
  isOpen,
  isConfirming = false,
  onConfirm,
  onEdit,
  onReject,
  onClose,
  onNext,
  onPrevious,
}: UseGhostTextKeyboardOptions) {
  // Keep callbacks in a ref to avoid listener churn on every re-render
  const callbacksRef = useRef({
    isConfirming,
    onConfirm,
    onEdit,
    onReject,
    onClose,
    onNext,
    onPrevious,
  });
  callbacksRef.current = {
    isConfirming,
    onConfirm,
    onEdit,
    onReject,
    onClose,
    onNext,
    onPrevious,
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      const cbs = callbacksRef.current;

      switch (e.key) {
        case 'Enter':
          if (!cbs.isConfirming) {
            e.preventDefault();
            cbs.onConfirm();
          }
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          cbs.onEdit();
          break;
        case 'Delete':
          e.preventDefault();
          cbs.onReject();
          break;
        case 'Escape':
          e.preventDefault();
          cbs.onClose();
          break;
        case 'ArrowRight':
          e.preventDefault();
          cbs.onNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          cbs.onPrevious();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
}
