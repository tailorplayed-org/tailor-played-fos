import { useEffect, useRef } from 'react';

export interface UseGhostTextKeyboardOptions {
  /** Whether the Ghost Text Card overlay is currently visible */
  isOpen: boolean;
  /** Whether a confirmation is currently in progress */
  isConfirming?: boolean;
  /** Whether user is currently editing a ghost text field (typing in search/dropdown) */
  isEditing?: boolean;
  /** Whether a searchable dropdown is currently open */
  isDropdownOpen?: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onReject: () => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  /** Called to close the dropdown when Escape is pressed while dropdown is open */
  onCloseDropdown?: () => void;
}

/**
 * Keyboard shortcut handler for the Ghost Text Card overlay.
 *
 * Registers `keydown` listener on `document` ONLY when the card is open.
 * Uses refs for callbacks to keep the listener stable across re-renders,
 * avoiding unnecessary listener detach/reattach churn.
 *
 * When `isEditing` is true, only Enter and Escape are handled —
 * letter keys, Delete, and arrows are passed through for text input
 * and dropdown navigation.
 *
 * Escape layering: if `isDropdownOpen`, Escape closes dropdown;
 * otherwise it closes the card.
 */
export function useGhostTextKeyboard({
  isOpen,
  isConfirming = false,
  isEditing = false,
  isDropdownOpen = false,
  onConfirm,
  onEdit,
  onReject,
  onClose,
  onNext,
  onPrevious,
  onCloseDropdown,
}: UseGhostTextKeyboardOptions) {
  // Keep callbacks in a ref to avoid listener churn on every re-render
  const callbacksRef = useRef({
    isConfirming,
    isEditing,
    isDropdownOpen,
    onConfirm,
    onEdit,
    onReject,
    onClose,
    onNext,
    onPrevious,
    onCloseDropdown,
  });
  callbacksRef.current = {
    isConfirming,
    isEditing,
    isDropdownOpen,
    onConfirm,
    onEdit,
    onReject,
    onClose,
    onNext,
    onPrevious,
    onCloseDropdown,
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

      // When editing, only handle Escape and Enter
      if (cbs.isEditing) {
        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            if (cbs.isDropdownOpen) {
              cbs.onCloseDropdown?.();
            } else {
              cbs.onClose();
            }
            break;
          case 'Enter':
            if (!cbs.isConfirming) {
              e.preventDefault();
              cbs.onConfirm();
            }
            break;
          // All other keys (E, Delete, arrows) pass through for text input
        }
        return;
      }

      // Normal mode (not editing)
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
          if (cbs.isDropdownOpen) {
            cbs.onCloseDropdown?.();
          } else {
            cbs.onClose();
          }
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
