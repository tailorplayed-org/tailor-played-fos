import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGhostTextKeyboard } from './useGhostTextKeyboard';

function createCallbacks() {
  return {
    onConfirm: vi.fn(),
    onEdit: vi.fn(),
    onReject: vi.fn(),
    onClose: vi.fn(),
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onCloseDropdown: vi.fn(),
  };
}

function fireKey(key: string, opts?: Partial<KeyboardEventInit>) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }));
}

describe('useGhostTextKeyboard', () => {
  let callbacks: ReturnType<typeof createCallbacks>;

  beforeEach(() => {
    callbacks = createCallbacks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Normal mode (existing tests) ───

  it('calls onConfirm on Enter key', () => {
    renderHook(() =>
      useGhostTextKeyboard({ isOpen: true, ...callbacks }),
    );

    fireKey('Enter');
    expect(callbacks.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit on E key', () => {
    renderHook(() =>
      useGhostTextKeyboard({ isOpen: true, ...callbacks }),
    );

    fireKey('E');
    expect(callbacks.onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit on lowercase e key', () => {
    renderHook(() =>
      useGhostTextKeyboard({ isOpen: true, ...callbacks }),
    );

    fireKey('e');
    expect(callbacks.onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onReject on Delete key', () => {
    renderHook(() =>
      useGhostTextKeyboard({ isOpen: true, ...callbacks }),
    );

    fireKey('Delete');
    expect(callbacks.onReject).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', () => {
    renderHook(() =>
      useGhostTextKeyboard({ isOpen: true, ...callbacks }),
    );

    fireKey('Escape');
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onNext on ArrowRight key', () => {
    renderHook(() =>
      useGhostTextKeyboard({ isOpen: true, ...callbacks }),
    );

    fireKey('ArrowRight');
    expect(callbacks.onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onPrevious on ArrowLeft key', () => {
    renderHook(() =>
      useGhostTextKeyboard({ isOpen: true, ...callbacks }),
    );

    fireKey('ArrowLeft');
    expect(callbacks.onPrevious).toHaveBeenCalledTimes(1);
  });

  it('does NOT register listeners when isOpen is false', () => {
    renderHook(() =>
      useGhostTextKeyboard({ isOpen: false, ...callbacks }),
    );

    fireKey('Enter');
    fireKey('Escape');
    expect(callbacks.onConfirm).not.toHaveBeenCalled();
    expect(callbacks.onClose).not.toHaveBeenCalled();
  });

  it('does NOT fire onConfirm when isConfirming is true', () => {
    renderHook(() =>
      useGhostTextKeyboard({
        isOpen: true,
        isConfirming: true,
        ...callbacks,
      }),
    );

    fireKey('Enter');
    expect(callbacks.onConfirm).not.toHaveBeenCalled();
  });

  it('does NOT fire when input element is focused', () => {
    renderHook(() =>
      useGhostTextKeyboard({ isOpen: true, ...callbacks }),
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    Object.defineProperty(event, 'target', { value: input });
    document.dispatchEvent(event);

    expect(callbacks.onConfirm).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('does NOT fire when textarea element is focused', () => {
    renderHook(() =>
      useGhostTextKeyboard({ isOpen: true, ...callbacks }),
    );

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent('keydown', { key: 'e', bubbles: true });
    Object.defineProperty(event, 'target', { value: textarea });
    document.dispatchEvent(event);

    expect(callbacks.onEdit).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() =>
      useGhostTextKeyboard({ isOpen: true, ...callbacks }),
    );

    unmount();

    fireKey('Enter');
    expect(callbacks.onConfirm).not.toHaveBeenCalled();
  });

  it('cleans up listener when isOpen changes to false', () => {
    const { rerender } = renderHook(
      ({ isOpen }) => useGhostTextKeyboard({ isOpen, ...callbacks }),
      { initialProps: { isOpen: true } },
    );

    // Verify listener is active
    fireKey('Enter');
    expect(callbacks.onConfirm).toHaveBeenCalledTimes(1);

    // Close the overlay
    rerender({ isOpen: false });

    // Listener should be cleaned up
    fireKey('Enter');
    expect(callbacks.onConfirm).toHaveBeenCalledTimes(1); // Still 1, not 2
  });

  // ─── Edit mode tests ───

  it('does NOT intercept E key when isEditing is true', () => {
    renderHook(() =>
      useGhostTextKeyboard({
        isOpen: true,
        isEditing: true,
        ...callbacks,
      }),
    );

    fireKey('E');
    fireKey('e');
    expect(callbacks.onEdit).not.toHaveBeenCalled();
  });

  it('does NOT intercept Delete key when isEditing is true', () => {
    renderHook(() =>
      useGhostTextKeyboard({
        isOpen: true,
        isEditing: true,
        ...callbacks,
      }),
    );

    fireKey('Delete');
    expect(callbacks.onReject).not.toHaveBeenCalled();
  });

  it('does NOT intercept ArrowRight/ArrowLeft when isEditing is true', () => {
    renderHook(() =>
      useGhostTextKeyboard({
        isOpen: true,
        isEditing: true,
        ...callbacks,
      }),
    );

    fireKey('ArrowRight');
    fireKey('ArrowLeft');
    expect(callbacks.onNext).not.toHaveBeenCalled();
    expect(callbacks.onPrevious).not.toHaveBeenCalled();
  });

  it('still handles Enter when isEditing is true', () => {
    renderHook(() =>
      useGhostTextKeyboard({
        isOpen: true,
        isEditing: true,
        ...callbacks,
      }),
    );

    fireKey('Enter');
    expect(callbacks.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('still handles Escape when isEditing is true', () => {
    renderHook(() =>
      useGhostTextKeyboard({
        isOpen: true,
        isEditing: true,
        ...callbacks,
      }),
    );

    fireKey('Escape');
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });

  // ─── Escape layering (dropdown) tests ───

  it('calls onCloseDropdown when Escape pressed and isDropdownOpen is true', () => {
    renderHook(() =>
      useGhostTextKeyboard({
        isOpen: true,
        isDropdownOpen: true,
        ...callbacks,
      }),
    );

    fireKey('Escape');
    expect(callbacks.onCloseDropdown).toHaveBeenCalledTimes(1);
    expect(callbacks.onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape pressed and isDropdownOpen is false', () => {
    renderHook(() =>
      useGhostTextKeyboard({
        isOpen: true,
        isDropdownOpen: false,
        ...callbacks,
      }),
    );

    fireKey('Escape');
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
    expect(callbacks.onCloseDropdown).not.toHaveBeenCalled();
  });

  it('calls onCloseDropdown on Escape when editing with dropdown open', () => {
    renderHook(() =>
      useGhostTextKeyboard({
        isOpen: true,
        isEditing: true,
        isDropdownOpen: true,
        ...callbacks,
      }),
    );

    fireKey('Escape');
    expect(callbacks.onCloseDropdown).toHaveBeenCalledTimes(1);
    expect(callbacks.onClose).not.toHaveBeenCalled();
  });
});
