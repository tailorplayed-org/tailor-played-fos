import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  CheckCircle: ({ className }: { size?: number; weight?: string; className?: string }) => (
    <svg data-testid="icon-CheckCircle" className={className} />
  ),
}));

// Mock child component to isolate ReviewQueue tests
vi.mock('./ReviewQueueItem', () => ({
  ReviewQueueItem: ({
    transaction,
    selected,
  }: {
    transaction: { id: string; vendorName: string };
    selected: boolean;
  }) => (
    <div data-testid={`queue-item-${transaction.id}`} data-selected={selected}>
      {transaction.vendorName}
    </div>
  ),
}));

// Mock Skeleton
vi.mock('@/components/Skeleton', () => ({
  Skeleton: ({ width, height }: { width?: string | number; height?: number; variant?: string }) => (
    <div data-testid="skeleton" style={{ width: String(width), height }} />
  ),
}));

const { ReviewQueue } = await import('./ReviewQueue');

type Transaction = import('@/types').Transaction;

function makeTxn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '1',
    vendorName: 'Test Vendor',
    amountAgora: 5000,
    currency: 'ILS',
    date: new Date('2026-02-13'),
    category: 'DirectCost',
    workOrderId: null,
    inventoryItemId: null,
    status: 'pending_review',
    aiConfidence: 90,
    originalFileUrl: null,
    source: 'ai',
    sourceEmailRef: null,
    notes: null,
    createdAt: new Date('2026-02-13'),
    updatedAt: new Date('2026-02-13'),
    suggestedWorkOrderId: null,
    suggestedInventoryItemId: null,
    classificationReasoning: null,
    isEstimatedConversion: false,
    conversionRate: null,
    conversionRateDate: null,
    conversionRateStale: false,
    ...overrides,
  };
}

describe('ReviewQueue', () => {
  it('renders loading skeleton when loading is true', () => {
    render(
      <ReviewQueue
        transactions={[]}
        loading={true}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no transactions and not loading', () => {
    render(
      <ReviewQueue
        transactions={[]}
        loading={false}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId('icon-CheckCircle')).toBeInTheDocument();
    expect(screen.getByText('empty.allCaughtUp')).toBeInTheDocument();
  });

  it('renders last review time in empty state when provided', () => {
    const lastReviewed = new Date('2026-02-12T10:00:00');

    render(
      <ReviewQueue
        transactions={[]}
        loading={false}
        selectedId={null}
        onSelect={vi.fn()}
        lastReviewedAt={lastReviewed}
      />,
    );

    // The mock t() returns the key with params appended
    expect(screen.getByText(/review\.queue\.lastReviewAt/)).toBeInTheDocument();
  });

  it('renders pending count and list of items', () => {
    const transactions = [
      makeTxn({ id: 'a', vendorName: 'Vendor A' }),
      makeTxn({ id: 'b', vendorName: 'Vendor B' }),
    ];

    render(
      <ReviewQueue
        transactions={transactions}
        loading={false}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    // Pending count: mock t() returns key with params
    expect(screen.getByText(/review\.queue\.pendingCount/)).toBeInTheDocument();
    expect(screen.getByTestId('queue-item-a')).toBeInTheDocument();
    expect(screen.getByTestId('queue-item-b')).toBeInTheDocument();
  });

  it('passes selected state to correct item', () => {
    const transactions = [
      makeTxn({ id: 'x', vendorName: 'X' }),
      makeTxn({ id: 'y', vendorName: 'Y' }),
    ];

    render(
      <ReviewQueue
        transactions={transactions}
        loading={false}
        selectedId="x"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId('queue-item-x').dataset.selected).toBe('true');
    expect(screen.getByTestId('queue-item-y').dataset.selected).toBe('false');
  });

  it('renders sort hint text', () => {
    render(
      <ReviewQueue
        transactions={[makeTxn()]}
        loading={false}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('review.queue.sortedByAttention')).toBeInTheDocument();
  });
});
