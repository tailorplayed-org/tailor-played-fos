import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock currency formatting
vi.mock('@/lib/currency', () => ({
  formatCurrency: (amount: number) => `₪${(amount / 100).toFixed(2)}`,
}));

// Mock Button
vi.mock('@/components/Button', () => ({
  Button: ({
    children,
    variant,
    onClick,
    loading,
    disabled,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
  }) => (
    <button
      data-testid={`btn-${variant}`}
      data-loading={loading}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

// Mock Phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  Lightning: () => <svg data-testid="icon-lightning" />,
}));

import type { Transaction } from '@/types';
import { ApproveAllBar } from './ApproveAllBar';

function createMockTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    id: 'txn-1',
    vendorName: 'Test Vendor',
    amountAgora: 8250,
    currency: 'ILS',
    date: new Date('2026-02-13'),
    category: 'DirectCost',
    workOrderId: null,
    inventoryItemId: null,
    status: 'pending_review',
    aiConfidence: 92,
    originalFileUrl: null,
    source: 'ai',
    sourceEmailRef: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    suggestedWorkOrderId: 'wo-1',
    suggestedInventoryItemId: null,
    classificationReasoning: null,
    isEstimatedConversion: false,
    conversionRate: null,
    conversionRateDate: null,
    conversionRateStale: false,
    ...overrides,
  };
}

const defaultProps = {
  batchEligible: [
    createMockTransaction({ id: 'txn-1', amountAgora: 5000 }),
    createMockTransaction({ id: 'txn-2', amountAgora: 3000 }),
  ],
  totalAmountIlsAgora: 8000,
  isBatchApproving: false,
  showBatchConfirm: false,
  onApproveAll: vi.fn(),
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('ApproveAllBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Visibility ───

  it('renders bar when >= 2 eligible items', () => {
    render(<ApproveAllBar {...defaultProps} />);

    expect(screen.getByTestId('approve-all-bar')).toBeInTheDocument();
  });

  it('renders nothing when < 2 eligible items', () => {
    const { container } = render(
      <ApproveAllBar
        {...defaultProps}
        batchEligible={[createMockTransaction({ id: 'txn-1' })]}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing with empty eligible list', () => {
    const { container } = render(
      <ApproveAllBar {...defaultProps} batchEligible={[]} />,
    );

    expect(container.firstChild).toBeNull();
  });

  // ─── Default state ───

  it('shows count of eligible items', () => {
    render(<ApproveAllBar {...defaultProps} />);

    // Mock t() returns key with params appended: "review.batchApproval.itemsReady|count=2"
    expect(screen.getByText(/review\.batchApproval\.itemsReady/)).toBeInTheDocument();
  });

  it('shows total amount', () => {
    render(<ApproveAllBar {...defaultProps} />);

    expect(screen.getByText(/review\.batchApproval\.totalAmount/)).toBeInTheDocument();
  });

  it('shows Approve All button in default state', () => {
    render(<ApproveAllBar {...defaultProps} />);

    expect(screen.getByText('review.batchApproval.approveAll')).toBeInTheDocument();
  });

  it('calls onApproveAll when Approve All button is clicked', () => {
    const onApproveAll = vi.fn();
    render(<ApproveAllBar {...defaultProps} onApproveAll={onApproveAll} />);

    fireEvent.click(screen.getByTestId('btn-primary'));
    expect(onApproveAll).toHaveBeenCalledTimes(1);
  });

  // ─── Confirmation state ───

  it('shows confirmation text when showBatchConfirm is true', () => {
    render(
      <ApproveAllBar {...defaultProps} showBatchConfirm={true} />,
    );

    expect(screen.getByText(/review\.batchApproval\.confirmTitle/)).toBeInTheDocument();
  });

  it('shows Confirm and Cancel buttons in confirmation state', () => {
    render(
      <ApproveAllBar {...defaultProps} showBatchConfirm={true} />,
    );

    expect(screen.getByText('review.batchApproval.confirm')).toBeInTheDocument();
    expect(screen.getByText('review.batchApproval.cancel')).toBeInTheDocument();
  });

  it('calls onConfirm when Confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ApproveAllBar
        {...defaultProps}
        showBatchConfirm={true}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByTestId('btn-primary'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ApproveAllBar
        {...defaultProps}
        showBatchConfirm={true}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByTestId('btn-secondary'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  // ─── Processing state ───

  it('shows loading state during batch processing', () => {
    render(
      <ApproveAllBar
        {...defaultProps}
        showBatchConfirm={true}
        isBatchApproving={true}
      />,
    );

    const confirmBtn = screen.getByTestId('btn-primary');
    expect(confirmBtn).toHaveAttribute('data-loading', 'true');
    expect(confirmBtn).toBeDisabled();
  });

  it('disables cancel button during batch processing', () => {
    render(
      <ApproveAllBar
        {...defaultProps}
        showBatchConfirm={true}
        isBatchApproving={true}
      />,
    );

    const cancelBtn = screen.getByTestId('btn-secondary');
    expect(cancelBtn).toBeDisabled();
  });

  // ─── Accessibility ───

  it('has aria-live="polite" for screen reader announcements', () => {
    render(<ApproveAllBar {...defaultProps} />);

    const bar = screen.getByTestId('approve-all-bar');
    expect(bar).toHaveAttribute('aria-live', 'polite');
  });

  it('has role="alertdialog" on confirmation content', () => {
    render(
      <ApproveAllBar {...defaultProps} showBatchConfirm={true} />,
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
