import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  FileText: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-FileText" className={className} />
  ),
}));

// Mock useWorkOrderStore
const mockWorkOrder = { name: 'David\'s Game' };
const mockSelectWorkOrderById = vi.fn(() => () => mockWorkOrder);
vi.mock('@/stores', () => ({
  useWorkOrderStore: (selector: (state: unknown) => unknown) => selector({
    workOrders: [{ id: 'wo-1', name: 'David\'s Game' }],
  }),
  selectWorkOrderById: (...args: unknown[]) => mockSelectWorkOrderById(...args),
}));

// Mock currency and dates
vi.mock('@/lib/currency', () => ({
  formatCurrency: (amount: number, currency: string) => `${currency} ${amount}`,
}));

vi.mock('@/lib/dates', () => ({
  relativeTime: () => 'Today',
}));

// Mock Badge component
vi.mock('@/components/Badge', () => ({
  Badge: ({ label, color }: { label: string; color?: string }) => (
    <span data-testid="badge" data-color={color}>{label}</span>
  ),
}));

// Mock Button component
vi.mock('@/components/Button', () => ({
  Button: ({
    children,
    variant,
    shortcut,
    onClick,
    loading,
    disabled,
  }: {
    children: React.ReactNode;
    variant?: string;
    shortcut?: string;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
  }) => (
    <button
      data-testid={`btn-${variant}`}
      data-shortcut={shortcut}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {children}
      {shortcut && <kbd>{shortcut}</kbd>}
    </button>
  ),
}));

import type { Transaction } from '@/types';
import { GhostTextCard } from './GhostTextCard';

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
    originalFileUrl: 'https://storage.example.com/doc.pdf',
    source: 'ai',
    sourceEmailRef: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    suggestedWorkOrderId: 'wo-1',
    suggestedInventoryItemId: null,
    classificationReasoning: 'Matched to David\'s Game — vendor linked 3 times previously',
    isEstimatedConversion: false,
    conversionRate: null,
    conversionRateDate: null,
    conversionRateStale: false,
    ...overrides,
  };
}

const defaultProps = {
  onConfirm: vi.fn(),
  onEdit: vi.fn(),
  onReject: vi.fn(),
};

describe('GhostTextCard', () => {
  it('renders header with vendor name, date, and amount', () => {
    render(
      <GhostTextCard transaction={createMockTransaction()} {...defaultProps} />,
    );

    expect(screen.getByText('Test Vendor')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('ILS 8250')).toBeInTheDocument();
    expect(screen.getByTestId('icon-FileText')).toBeInTheDocument();
  });

  it('renders ghost text fields for category and project', () => {
    render(
      <GhostTextCard transaction={createMockTransaction()} {...defaultProps} />,
    );

    expect(screen.getByText('review.ghostText.category')).toBeInTheDocument();
    expect(screen.getByText('transactions.category.DirectCost')).toBeInTheDocument();
    expect(screen.getByText('review.ghostText.project')).toBeInTheDocument();
    expect(screen.getByText('David\'s Game')).toBeInTheDocument();
  });

  it('renders confidence bar with high confidence styling', () => {
    render(
      <GhostTextCard
        transaction={createMockTransaction({ aiConfidence: 92 })}
        {...defaultProps}
      />,
    );

    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '92',
    );
  });

  it('renders confidence bar with low confidence styling', () => {
    render(
      <GhostTextCard
        transaction={createMockTransaction({ aiConfidence: 60 })}
        {...defaultProps}
      />,
    );

    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('renders AI reasoning bubble', () => {
    render(
      <GhostTextCard transaction={createMockTransaction()} {...defaultProps} />,
    );

    expect(screen.getByText('review.ghostText.aiReasoning')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Matched to David\'s Game — vendor linked 3 times previously',
      ),
    ).toBeInTheDocument();
  });

  it('does not render AI reasoning when classificationReasoning is null', () => {
    render(
      <GhostTextCard
        transaction={createMockTransaction({ classificationReasoning: null })}
        {...defaultProps}
      />,
    );

    expect(screen.queryByText('review.ghostText.aiReasoning')).not.toBeInTheDocument();
  });

  it('renders action buttons with correct variants and shortcuts', () => {
    render(
      <GhostTextCard transaction={createMockTransaction()} {...defaultProps} />,
    );

    expect(screen.getByTestId('btn-primary')).toBeInTheDocument();
    expect(screen.getByTestId('btn-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('btn-danger')).toBeInTheDocument();

    expect(screen.getByTestId('btn-primary')).toHaveAttribute(
      'data-shortcut',
      'Enter',
    );
    expect(screen.getByTestId('btn-secondary')).toHaveAttribute(
      'data-shortcut',
      'E',
    );
    expect(screen.getByTestId('btn-danger')).toHaveAttribute(
      'data-shortcut',
      'Del',
    );
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <GhostTextCard
        transaction={createMockTransaction()}
        {...defaultProps}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByTestId('btn-primary'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <GhostTextCard
        transaction={createMockTransaction()}
        {...defaultProps}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByTestId('btn-secondary'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onReject when reject button is clicked', () => {
    const onReject = vi.fn();
    render(
      <GhostTextCard
        transaction={createMockTransaction()}
        {...defaultProps}
        onReject={onReject}
      />,
    );

    fireEvent.click(screen.getByTestId('btn-danger'));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('renders "View original document" link when originalFileUrl is present', () => {
    render(
      <GhostTextCard transaction={createMockTransaction()} {...defaultProps} />,
    );

    const link = screen.getByText(/review\.ghostText\.viewOriginal/);
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://storage.example.com/doc.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not render "View original document" link when originalFileUrl is null', () => {
    render(
      <GhostTextCard
        transaction={createMockTransaction({ originalFileUrl: null })}
        {...defaultProps}
      />,
    );

    expect(
      screen.queryByText(/review\.ghostText\.viewOriginal/),
    ).not.toBeInTheDocument();
  });

  it('renders "Estimated" badge when isEstimatedConversion is true', () => {
    render(
      <GhostTextCard
        transaction={createMockTransaction({ isEstimatedConversion: true })}
        {...defaultProps}
      />,
    );

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('review.ghostText.estimated');
    expect(badge).toHaveAttribute('data-color', 'warning');
  });

  it('does not render "Estimated" badge when isEstimatedConversion is false', () => {
    render(
      <GhostTextCard
        transaction={createMockTransaction({ isEstimatedConversion: false })}
        {...defaultProps}
      />,
    );

    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('disables confirm button when isConfirming is true', () => {
    render(
      <GhostTextCard
        transaction={createMockTransaction()}
        {...defaultProps}
        isConfirming={true}
      />,
    );

    expect(screen.getByTestId('btn-primary')).toBeDisabled();
  });

  it('renders with dialog role, aria-modal, and vendor name as aria-label', () => {
    render(
      <GhostTextCard transaction={createMockTransaction()} {...defaultProps} />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Test Vendor');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('shows dash when no work order or suggestedWorkOrderId', () => {
    mockSelectWorkOrderById.mockReturnValueOnce(() => undefined);
    render(
      <GhostTextCard
        transaction={createMockTransaction({ suggestedWorkOrderId: null })}
        {...defaultProps}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('handles zero confidence gracefully', () => {
    render(
      <GhostTextCard
        transaction={createMockTransaction({ aiConfidence: null })}
        {...defaultProps}
      />,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });
});
