import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  CheckCircle: ({ className }: { size?: number; weight?: string; className?: string }) => (
    <svg data-testid="icon-CheckCircle" className={className} />
  ),
  WarningCircle: ({ className }: { size?: number; weight?: string; className?: string }) => (
    <svg data-testid="icon-WarningCircle" className={className} />
  ),
  FileText: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-FileText" className={className} />
  ),
}));

// Mock stores
vi.mock('@/stores/useUIStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/stores', () => ({
  useWorkOrderStore: (selector: (state: unknown) => unknown) =>
    selector({ workOrders: [{ id: 'wo-1', name: "David's Game", status: 'Production' }] }),
  selectWorkOrderById: () => () => undefined,
}));

// Mock currency and dates
vi.mock('@/lib/currency', () => ({
  formatCurrency: (amount: number, currency: string) => `${currency} ${amount}`,
}));

vi.mock('@/lib/dates', () => ({
  relativeTime: () => 'Today',
}));

// Mock Badge & Button
vi.mock('@/components/Badge', () => ({
  Badge: ({ label }: { label: string }) => <span data-testid="badge">{label}</span>,
  ConfidenceBadge: ({ confidence }: { confidence: number }) => (
    <span data-testid="confidence-badge">{confidence}%</span>
  ),
}));

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
    >
      {children}
    </button>
  ),
}));

// Mock Select
vi.mock('@/components/Input/Select', () => ({
  Select: ({
    options,
    value,
    onChange,
  }: {
    options: Array<{ value: string; label: string }>;
    value?: string;
    onChange?: (val: string) => void;
    searchable?: boolean;
    label: string;
    hideLabel?: boolean;
  }) => (
    <div data-testid="select-dropdown">
      <button data-testid="select-trigger">
        {options.find((o) => o.value === value)?.label ?? ''}
      </button>
      <ul role="listbox">
        {options.map((opt) => (
          <li
            key={opt.value}
            role="option"
            aria-selected={opt.value === value}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.label}
          </li>
        ))}
      </ul>
    </div>
  ),
}));

// Mock firebase/firestore
const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn((_db, _collection, id) => ({ path: `transactions/${id}` }));
const mockWriteBatch = vi.fn(() => ({
  update: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('firebase/firestore', () => ({
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
}));

vi.mock('@/services', () => ({
  db: { type: 'firestore' },
}));

// Mock the hooks
const mockUsePendingReview = vi.fn();
const mockConfirm = vi.fn().mockResolvedValue(undefined);
const mockReject = vi.fn().mockResolvedValue(undefined);

vi.mock('./hooks', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePendingReview: () => mockUsePendingReview(),
    useConfirmTransaction: () => ({
      confirm: mockConfirm,
      isConfirming: false,
    }),
    useRejectTransaction: () => ({
      reject: mockReject,
      isRejecting: false,
    }),
    useBatchApproval: () => ({
      batchEligible: [],
      totalAmountIlsAgora: 0,
      isBatchApproving: false,
      showBatchConfirm: false,
      requestBatchApproval: vi.fn(),
      cancelBatchApproval: vi.fn(),
      confirmBatchApproval: vi.fn(),
    }),
  };
});

// Mock ReviewQueue to isolate page tests
vi.mock('./components', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
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
  };
});

function createMockTransaction(id: string, vendorName: string) {
  return {
    id,
    vendorName,
    amountAgora: 8250,
    currency: 'ILS' as const,
    date: new Date('2026-02-13'),
    category: 'DirectCost' as const,
    workOrderId: null,
    inventoryItemId: null,
    status: 'pending_review' as const,
    aiConfidence: 92,
    originalFileUrl: null,
    source: 'ai' as const,
    sourceEmailRef: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    suggestedWorkOrderId: null,
    suggestedInventoryItemId: null,
    classificationReasoning: 'Test reasoning',
    isEstimatedConversion: false,
    conversionRate: null,
    conversionRateDate: null,
    conversionRateStale: false,
  };
}

const { ReviewPage } = await import('./ReviewPage');

describe('ReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateDoc.mockResolvedValue(undefined);
    mockConfirm.mockResolvedValue(undefined);
    mockReject.mockResolvedValue(undefined);
  });

  // ─── Existing tests ───

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
        createMockTransaction('a', 'Vendor A'),
        createMockTransaction('b', 'Vendor B'),
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
      pendingTransactions: [createMockTransaction('sel-1', 'Selected')],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);

    fireEvent.click(screen.getByTestId('item-sel-1'));

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

  // ─── Ghost Text Integration Tests ───

  it('opens Ghost Text overlay when a transaction is selected', async () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [createMockTransaction('txn-1', 'Test Vendor')],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);

    fireEvent.click(screen.getByTestId('item-txn-1'));

    await waitFor(() => {
      expect(screen.getByTestId('ghost-text-overlay')).toBeInTheDocument();
    });
  });

  it('closes overlay when Escape is pressed', async () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [createMockTransaction('txn-1', 'Test Vendor')],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);

    fireEvent.click(screen.getByTestId('item-txn-1'));
    await waitFor(() => {
      expect(screen.getByTestId('ghost-text-overlay')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('ghost-text-overlay')).not.toBeInTheDocument();
    });
  });

  it('closes overlay when overlay background is clicked', async () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [createMockTransaction('txn-1', 'Test Vendor')],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);

    fireEvent.click(screen.getByTestId('item-txn-1'));
    await waitFor(() => {
      expect(screen.getByTestId('ghost-text-overlay')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('ghost-text-overlay'));

    await waitFor(() => {
      expect(screen.queryByTestId('ghost-text-overlay')).not.toBeInTheDocument();
    });
  });

  it('does not render overlay when no transaction is selected', () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [createMockTransaction('txn-1', 'Test Vendor')],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);

    expect(screen.queryByTestId('ghost-text-overlay')).not.toBeInTheDocument();
  });

  // ─── Edit Mode Integration Tests ───

  it('enters edit mode when E key is pressed', async () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [createMockTransaction('txn-1', 'Test Vendor')],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);

    // Select item to open overlay
    fireEvent.click(screen.getByTestId('item-txn-1'));
    await waitFor(() => {
      expect(screen.getByTestId('ghost-text-overlay')).toBeInTheDocument();
    });

    // Press E to enter edit mode
    fireEvent.keyDown(document, { key: 'E' });

    // Ghost text fields should now be interactive (GhostTextField components rendered)
    await waitFor(() => {
      const fields = screen.getAllByTestId('ghost-text-field');
      expect(fields.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Reject Flow Integration Tests ───

  it('shows reject confirmation dialog when reject is triggered', async () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [createMockTransaction('txn-1', 'Test Vendor')],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);

    // Select item
    fireEvent.click(screen.getByTestId('item-txn-1'));
    await waitFor(() => {
      expect(screen.getByTestId('ghost-text-overlay')).toBeInTheDocument();
    });

    // Press Delete to trigger reject
    fireEvent.keyDown(document, { key: 'Delete' });

    // Reject confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  it('cancels rejection when cancel is clicked in reject dialog', async () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [createMockTransaction('txn-1', 'Test Vendor')],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);

    // Select item and trigger reject
    fireEvent.click(screen.getByTestId('item-txn-1'));
    await waitFor(() => {
      expect(screen.getByTestId('ghost-text-overlay')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Delete' });
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    // Click Cancel (the secondary button in the reject dialog)
    const cancelBtn = screen.getByText('review.ghostText.cancel');
    fireEvent.click(cancelBtn.closest('button')!);

    // Dialog should close, action buttons should return
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('does NOT approve transaction when Enter is pressed while reject dialog is showing', async () => {
    mockUsePendingReview.mockReturnValue({
      pendingTransactions: [createMockTransaction('txn-1', 'Test Vendor')],
      loading: false,
      error: null,
    });

    render(<ReviewPage />);

    // Select item
    fireEvent.click(screen.getByTestId('item-txn-1'));
    await waitFor(() => {
      expect(screen.getByTestId('ghost-text-overlay')).toBeInTheDocument();
    });

    // Trigger reject dialog
    fireEvent.keyDown(document, { key: 'Delete' });
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    // Press Enter while reject dialog is showing — should NOT approve
    fireEvent.keyDown(document, { key: 'Enter' });

    // confirm should NOT have been called
    expect(mockConfirm).not.toHaveBeenCalled();
    // Reject dialog should still be visible
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
