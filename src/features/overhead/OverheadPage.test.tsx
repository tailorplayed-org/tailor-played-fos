import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock useOverhead hook
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

// Mock useOverheadStore with selectCurrentMonth
const mockCurrentMonthEntries: Overhead[] = [];
vi.mock('@/stores', async () => {
  const actual = await vi.importActual('@/stores/useOverheadStore');
  return {
    ...actual,
    useOverheadStore: (selector?: (state: unknown) => unknown) => {
      if (selector) return mockCurrentMonthEntries;
      return mockOverheadState;
    },
    selectCurrentMonth: vi.fn(),
  };
});

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
    mockOverheadState.overhead = [];
    mockOverheadState.loading = false;
    mockOverheadState.error = null;
    mockCurrentMonthEntries.length = 0;
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
    mockCurrentMonthEntries.push(...entries);

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
    mockCurrentMonthEntries.push(...entries);

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
      makeOverhead({ id: '3', recurrence: 'one_time' }),
    ];
    mockOverheadState.overhead = entries;
    mockCurrentMonthEntries.push(...entries);

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
    mockCurrentMonthEntries.push(...entries);

    render(<OverheadPage />);
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('overhead.sourceManual')).toBeInTheDocument();
  });
});
