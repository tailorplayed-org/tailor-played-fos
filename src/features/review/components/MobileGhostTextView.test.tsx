import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  ArrowLeft: () => <svg data-testid="icon-arrow-left" />,
  CheckCircle: () => <svg data-testid="icon-check-circle" />,
  FileText: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-FileText" className={className} />
  ),
  CaretDown: () => <svg data-testid="icon-caret-down" />,
  CaretUp: () => <svg data-testid="icon-caret-up" />,
}));

// Mock useWorkOrderStore
vi.mock('@/stores', () => ({
  useWorkOrderStore: (selector: (state: unknown) => unknown) =>
    selector({
      workOrders: [{ id: 'wo-1', name: 'Test Project' }],
    }),
  selectWorkOrderById: () => () => ({ name: 'Test Project' }),
}));

// Mock currency and dates
vi.mock('@/lib/currency', () => ({
  formatCurrency: (amount: number, currency: string) => `${currency} ${amount}`,
}));

vi.mock('@/lib/dates', () => ({
  relativeTime: () => 'Today',
}));

// Mock Badge
vi.mock('@/components/Badge', () => ({
  Badge: ({ label }: { label: string }) => <span data-testid="badge">{label}</span>,
}));

// Mock Button
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
      data-loading={loading}
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

import type { Transaction } from '@/types';
import { MobileGhostTextView } from './MobileGhostTextView';

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
    classificationReasoning: 'AI reasoning text',
    isEstimatedConversion: false,
    conversionRate: null,
    conversionRateDate: null,
    conversionRateStale: false,
    ...overrides,
  };
}

const defaultProps = {
  transaction: createMockTransaction(),
  currentIndex: 0,
  totalCount: 3,
  onBack: vi.fn(),
  onConfirm: vi.fn(),
  onEdit: vi.fn(),
  onReject: vi.fn(),
};

describe('MobileGhostTextView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Full-screen rendering ───

  it('renders full-screen mobile view', () => {
    render(<MobileGhostTextView {...defaultProps} />);

    expect(screen.getByTestId('mobile-ghost-text-view')).toBeInTheDocument();
  });

  it('renders review counter "Review 1 of 3"', () => {
    render(<MobileGhostTextView {...defaultProps} />);

    // Mock t() returns key with params appended: "review.mobile.reviewCounter|current=1|total=3"
    expect(screen.getByText(/review\.mobile\.reviewCounter/)).toBeInTheDocument();
  });

  it('renders the transaction vendor name via GhostTextCard', () => {
    render(<MobileGhostTextView {...defaultProps} />);

    expect(screen.getByText('Test Vendor')).toBeInTheDocument();
  });

  // ─── Back button ───

  it('renders back arrow button', () => {
    render(<MobileGhostTextView {...defaultProps} />);

    const backButton = screen.getByLabelText('review.mobile.back');
    expect(backButton).toBeInTheDocument();
  });

  it('calls onBack when back arrow is clicked', () => {
    const onBack = vi.fn();
    render(<MobileGhostTextView {...defaultProps} onBack={onBack} />);

    fireEvent.click(screen.getByLabelText('review.mobile.back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  // ─── "All caught up" state ───

  it('shows "All caught up" when totalCount is 0', () => {
    render(
      <MobileGhostTextView
        {...defaultProps}
        totalCount={0}
      />,
    );

    expect(screen.getByText('review.mobile.allCaughtUp')).toBeInTheDocument();
    expect(screen.getByText('review.mobile.allCaughtUpMessage')).toBeInTheDocument();
  });

  it('still shows back button in "All caught up" state', () => {
    render(
      <MobileGhostTextView
        {...defaultProps}
        totalCount={0}
      />,
    );

    expect(screen.getByLabelText('review.mobile.back')).toBeInTheDocument();
  });

  // ─── Invoice preview (collapsible) ───

  it('shows invoice toggle when originalFileUrl exists', () => {
    render(
      <MobileGhostTextView
        {...defaultProps}
        transaction={createMockTransaction({ originalFileUrl: 'https://example.com/invoice.jpg' })}
      />,
    );

    expect(screen.getByText('review.mobile.invoicePreview')).toBeInTheDocument();
  });

  it('does not show invoice toggle when originalFileUrl is null', () => {
    render(
      <MobileGhostTextView
        {...defaultProps}
        transaction={createMockTransaction({ originalFileUrl: null })}
      />,
    );

    expect(screen.queryByText('review.mobile.invoicePreview')).not.toBeInTheDocument();
  });

  it('expands invoice preview on toggle click', () => {
    render(
      <MobileGhostTextView
        {...defaultProps}
        transaction={createMockTransaction({ originalFileUrl: 'https://example.com/invoice.jpg' })}
      />,
    );

    // Initially collapsed
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('review.mobile.invoicePreview'));

    // Image should appear
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/invoice.jpg');
  });

  it('collapses invoice preview on second toggle click', () => {
    render(
      <MobileGhostTextView
        {...defaultProps}
        transaction={createMockTransaction({ originalFileUrl: 'https://example.com/invoice.jpg' })}
      />,
    );

    const toggle = screen.getByText('review.mobile.invoicePreview');

    // Expand
    fireEvent.click(toggle);
    expect(screen.getByRole('img')).toBeInTheDocument();

    // Collapse
    fireEvent.click(toggle);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  // ─── Counter updates ───

  it('shows correct counter for different indices', () => {
    const { rerender } = render(
      <MobileGhostTextView {...defaultProps} currentIndex={1} totalCount={5} />,
    );

    // Mock t() returns key with params: "review.mobile.reviewCounter|current=2|total=5"
    expect(screen.getByText(/review\.mobile\.reviewCounter/)).toBeInTheDocument();

    rerender(
      <MobileGhostTextView {...defaultProps} currentIndex={4} totalCount={5} />,
    );

    expect(screen.getByText(/review\.mobile\.reviewCounter/)).toBeInTheDocument();
  });
});
