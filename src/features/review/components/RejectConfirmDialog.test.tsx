import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Button component
vi.mock('@/components/Button', () => ({
  Button: ({
    children,
    variant,
    onClick,
    loading,
    disabled,
  }: {
    children: React.ReactNode;
    variant?: string;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
  }) => (
    <button
      data-testid={`btn-${variant}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {children}
    </button>
  ),
}));

import { RejectConfirmDialog } from './RejectConfirmDialog';

describe('RejectConfirmDialog', () => {
  it('renders confirmation message', () => {
    render(
      <RejectConfirmDialog
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByText('review.ghostText.rejectConfirmTitle'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('review.ghostText.rejectConfirmMessage'),
    ).toBeInTheDocument();
  });

  it('renders Cancel and Reject buttons', () => {
    render(
      <RejectConfirmDialog
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByTestId('btn-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('btn-danger')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <RejectConfirmDialog
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('btn-secondary'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Reject button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <RejectConfirmDialog
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByTestId('btn-danger'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isRejecting is true', () => {
    render(
      <RejectConfirmDialog
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        isRejecting={true}
      />,
    );

    expect(screen.getByTestId('btn-secondary')).toBeDisabled();
    expect(screen.getByTestId('btn-danger')).toBeDisabled();
  });

  it('shows loading state on Reject button when isRejecting', () => {
    render(
      <RejectConfirmDialog
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        isRejecting={true}
      />,
    );

    expect(screen.getByTestId('btn-danger')).toHaveAttribute('aria-busy', 'true');
  });

  it('has alertdialog role with aria-describedby', () => {
    render(
      <RejectConfirmDialog
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-describedby', 'reject-confirm-message');
  });
});
