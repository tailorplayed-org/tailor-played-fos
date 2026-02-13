import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  CheckCircle: ({ className }: { size?: number; weight?: string; className?: string }) => (
    <svg data-testid="icon-CheckCircle" className={className} />
  ),
  WarningCircle: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-WarningCircle" className={className} />
  ),
}));

// Mock the hook
const mockUsePendingReview = vi.fn();
vi.mock('./hooks', () => ({
  usePendingReview: () => mockUsePendingReview(),
}));

// Mock ReviewQueue to isolate page tests
vi.mock('./components', () => ({
  ReviewQueue: ({
    transactions,
    loading,
    selectedId,
    onSelect,
  }: {
    transactions: Array<{ id: string; vendorName: string }>;
    loading: boolean;
    selectedId: string | null;
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="review-queue" data-loading={loading} data-selected={selectedId}>
      {transactions.map((t) => (
        <button key={t.id} data-testid={`item-${t.id}`} onClick={() => onSelect(t.id)}>
          {t.vendorName}
        </button>
      ))}
    </div>
  ),
}));

const { ReviewPage } = await import('./ReviewPage');

describe('ReviewPage', () => {
  it('renders page title', () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);
    expect(screen.getByText('pages.review.title')).toBeInTheDocument();
  });

  it('passes loading state to ReviewQueue', () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [],
      loading: true,
      error: null,
    });

    render(<ReviewPage />);
    expect(screen.getByTestId('review-queue').dataset.loading).toBe('true');
  });

  it('passes transactions to ReviewQueue', () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [
        { id: 'a', vendorName: 'Vendor A' },
        { id: 'b', vendorName: 'Vendor B' },
      ],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);
    expect(screen.getByTestId('item-a')).toBeInTheDocument();
    expect(screen.getByTestId('item-b')).toBeInTheDocument();
  });

  it('tracks selected transaction id on click', async () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [{ id: 'sel-1', vendorName: 'Selected' }],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);

    // Initially no selection (null renders as no attribute)
    expect(screen.getByTestId('review-queue')).not.toHaveAttribute('data-selected');

    // Click an item — triggers state update
    fireEvent.click(screen.getByTestId('item-sel-1'));

    // Wait for React state update to propagate
    await waitFor(() => {
      expect(screen.getByTestId('review-queue').dataset.selected).toBe('sel-1');
    });
  });

  it('renders error state when error is present', () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [],
      loading: false,
      error: 'Firestore permission denied',
    });

    render(<ReviewPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('review.error.title')).toBeInTheDocument();
    expect(screen.getByText('Firestore permission denied')).toBeInTheDocument();
    expect(screen.getByTestId('icon-WarningCircle')).toBeInTheDocument();
  });

  it('does not render review queue when error is present', () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [],
      loading: false,
      error: 'Connection failed',
    });

    render(<ReviewPage />);

    expect(screen.queryByTestId('review-queue')).not.toBeInTheDocument();
  });
});
