import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Overhead } from '@/types';

// Mock Phosphor icons — include all icons used transitively
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string; weight?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };

  return {
    Receipt: iconStub('Receipt'),
    Plus: iconStub('Plus'),
    Repeat: iconStub('Repeat'),
    Desktop: iconStub('Desktop'),
    ForkKnife: iconStub('ForkKnife'),
    Buildings: iconStub('Buildings'),
    DotsThreeCircle: iconStub('DotsThreeCircle'),
    // Toast
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Warning: iconStub('Warning'),
    Info: iconStub('Info'),
    X: iconStub('X'),
    // Layout
    Bell: iconStub('Bell'),
    ChartBar: iconStub('ChartBar'),
    ClipboardText: iconStub('ClipboardText'),
    GearSix: iconStub('GearSix'),
    Tray: iconStub('Tray'),
    // SearchInput
    MagnifyingGlass: iconStub('MagnifyingGlass'),
  };
});

// Mock Firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    addDoc: vi.fn().mockResolvedValue({ id: 'new-overhead-id' }),
    collection: vi.fn((_db: unknown, name: string) => ({ path: name })),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
    Timestamp: { fromDate: vi.fn((d: Date) => d) },
  };
});

// Mock services
vi.mock('@/services', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123' } },
}));

// Mock toast
vi.mock('@/stores/useUIStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock currency
vi.mock('@/lib/currency', () => ({
  formatCurrency: (amountAgora: number) => `₪${(amountAgora / 100).toFixed(2)}`,
  toMinorUnits: (amount: number) => Math.round(amount * 100),
}));

// Mock useOverhead hook — the component derives current/previous month from this
const mockOverheadState = {
  overhead: [] as Overhead[],
  loading: false,
  error: null as string | null,
  setOverhead: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

vi.mock('./hooks', () => ({
  useOverhead: () => mockOverheadState,
}));

// Mock @/stores — only calculateBurn is imported by the component now
// (useOverheadStore selectors are no longer used — SAFER pattern via useMemo)
vi.mock('@/stores', () => ({
  calculateBurn: (entries: Overhead[]) =>
    entries.reduce((sum: number, item: Overhead) => {
      if (item.recurrence === 'yearly') return sum + Math.round(item.amountAgora / 12);
      return sum + item.amountAgora;
    }, 0),
}));

const { OverheadPage } = await import('./OverheadPage');

const makeOverhead = (overrides: Partial<Overhead> = {}): Overhead => ({
  id: 'oh-1',
  category: 'software',
  amountAgora: 8200,
  currency: 'ILS',
  date: new Date('2026-02-10'),
  description: 'Adobe subscription',
  recurrence: 'monthly',
  source: 'manual',
  transactionId: null,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-02-10'),
  ...overrides,
});

describe('OverheadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0)); // Feb 7, 2026
    mockOverheadState.overhead = [];
    mockOverheadState.loading = false;
    mockOverheadState.error = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows loading skeleton initially', () => {
    mockOverheadState.loading = true;
    render(<OverheadPage />);
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders CategoryBreakdown when overhead entries exist', () => {
    const entries = [
      makeOverhead({ id: '1', category: 'software', amountAgora: 5000 }),
      makeOverhead({ id: '2', category: 'meals', amountAgora: 2000 }),
    ];
    mockOverheadState.overhead = entries;

    render(<OverheadPage />);
    expect(screen.getByText('overhead.breakdown.title')).toBeInTheDocument();
  });

  it('renders entry rows with correct data', () => {
    const entries = [
      makeOverhead({
        id: '1',
        category: 'software',
        description: 'Adobe subscription',
        amountAgora: 8200,
        recurrence: 'monthly',
        source: 'manual',
      }),
    ];
    mockOverheadState.overhead = entries;

    render(<OverheadPage />);
    expect(screen.getByText('Adobe subscription')).toBeInTheDocument();
    // Amount appears in monthly total, category total, and entry row
    const amountElements = screen.getAllByText('₪82.00');
    expect(amountElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('overhead.recurrence.monthly')).toBeInTheDocument();
    expect(screen.getByText('overhead.sourceManual')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<OverheadPage />);
    expect(screen.getByText('overhead.emptyTitle')).toBeInTheDocument();
    expect(screen.getByText('overhead.emptyDescription')).toBeInTheDocument();
  });

  it('opens form when Add Overhead clicked', () => {
    render(<OverheadPage />);
    const addButtons = screen.getAllByText('overhead.addButton');
    fireEvent.click(addButtons[0]);
    expect(screen.getByText('overhead.form.title')).toBeInTheDocument();
  });

  it('hides form when cancel clicked', () => {
    render(<OverheadPage />);
    const addButtons = screen.getAllByText('overhead.addButton');
    fireEvent.click(addButtons[0]);
    expect(screen.getByText('overhead.form.title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('overhead.form.cancel'));
    expect(screen.queryByText('overhead.form.title')).not.toBeInTheDocument();
  });

  it('shows recurrence badge for monthly/yearly items', () => {
    const entries = [
      makeOverhead({ id: '1', recurrence: 'monthly' }),
      makeOverhead({ id: '2', recurrence: 'yearly' }),
      makeOverhead({ id: '3', recurrence: 'one_time', date: new Date(2026, 1, 5) }),
    ];
    mockOverheadState.overhead = entries;

    render(<OverheadPage />);
    expect(screen.getByText('overhead.recurrence.monthly')).toBeInTheDocument();
    expect(screen.getByText('overhead.recurrence.yearly')).toBeInTheDocument();
  });

  it('shows source badge (AI vs Manual)', () => {
    const entries = [
      makeOverhead({ id: '1', source: 'ai', category: 'software' }),
      makeOverhead({ id: '2', source: 'manual', category: 'meals' }),
    ];
    mockOverheadState.overhead = entries;

    render(<OverheadPage />);
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('overhead.sourceManual')).toBeInTheDocument();
  });

  it('shows delta badge when previous month has data — red (burnDeltaNegative) for increase', () => {
    // Current month (Feb): one_time 10000, Previous month (Jan): one_time 5000
    // Delta: (10000-5000)/5000 * 100 = 100% increase → red (negative for overhead)
    mockOverheadState.overhead = [
      makeOverhead({ id: '1', amountAgora: 10000, recurrence: 'one_time', date: new Date(2026, 1, 5) }),
      makeOverhead({ id: '2', amountAgora: 5000, recurrence: 'one_time', date: new Date(2026, 0, 15) }),
    ];

    render(<OverheadPage />);
    const delta = screen.getByTestId('burn-delta');
    expect(delta).toBeInTheDocument();
    expect(delta.textContent).toContain('↑');
    expect(delta.textContent).toContain('100%');
    // Overhead increase = negative (red) — inverted from revenue
    expect(delta.className).toContain('burnDeltaNegative');
    expect(delta.className).not.toContain('burnDeltaPositive');
  });

  it('shows delta badge green (burnDeltaPositive) for decrease', () => {
    // Current month (Feb): one_time 5000, Previous month (Jan): one_time 10000
    // Delta: (5000-10000)/10000 * 100 = -50% → green (positive for overhead)
    mockOverheadState.overhead = [
      makeOverhead({ id: '1', amountAgora: 5000, recurrence: 'one_time', date: new Date(2026, 1, 5) }),
      makeOverhead({ id: '2', amountAgora: 10000, recurrence: 'one_time', date: new Date(2026, 0, 15) }),
    ];

    render(<OverheadPage />);
    const delta = screen.getByTestId('burn-delta');
    expect(delta).toBeInTheDocument();
    expect(delta.textContent).toContain('↓');
    expect(delta.textContent).toContain('50%');
    // Overhead decrease = positive (green) — inverted from revenue
    expect(delta.className).toContain('burnDeltaPositive');
    expect(delta.className).not.toContain('burnDeltaNegative');
  });

  it('shows previous month amount below current', () => {
    // Both months have data so previous month line is visible
    mockOverheadState.overhead = [
      makeOverhead({ id: '1', amountAgora: 10000, recurrence: 'one_time', date: new Date(2026, 1, 5) }),
      makeOverhead({ id: '2', amountAgora: 8000, recurrence: 'one_time', date: new Date(2026, 0, 15) }),
    ];

    render(<OverheadPage />);
    expect(screen.getByText(/overhead\.burn\.previousMonth/)).toBeInTheDocument();
  });

  it('hides delta badge when no previous month data', () => {
    // Only current month one_time entry — no previous month data
    mockOverheadState.overhead = [
      makeOverhead({ id: '1', amountAgora: 10000, recurrence: 'one_time', date: new Date(2026, 1, 5) }),
    ];

    render(<OverheadPage />);
    expect(screen.queryByTestId('burn-delta')).not.toBeInTheDocument();
  });

  it('uses calculateBurn for total (verifies yearly proration)', () => {
    // Yearly entry — useMemo includes it as active recurring
    mockOverheadState.overhead = [
      makeOverhead({ id: '1', amountAgora: 12000, recurrence: 'yearly' }),
    ];

    render(<OverheadPage />);
    // yearly 12000 / 12 = 1000 agora = ₪10.00
    // Appears in both burn summary and category breakdown (both prorate)
    const amounts = screen.getAllByText('₪10.00');
    expect(amounts.length).toBeGreaterThanOrEqual(1);
  });
});
