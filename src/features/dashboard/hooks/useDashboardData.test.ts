import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { SystemConfig } from '@/types';

// Mock hooks
vi.mock('@/hooks', () => ({
  useFirestoreCollection: vi.fn(),
  useFirestoreDoc: vi.fn(),
}));

// Create mutable mock store states
const mockWoStore = {
  workOrders: [] as Array<{
    id: string;
    status: string;
    clientName: string;
    projectDescription: string;
    deadline: Date | null;
    revenueTotalAgora: number;
    directCostAgora: number;
    inventoryCostAgora: number;
    overheadAllocationAgora: number;
    createdAt: Date;
    updatedAt: Date;
  }>,
  loading: false,
  error: null as string | null,
  setWorkOrders: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

const mockTxnStore = {
  transactions: [] as Array<{
    id: string;
    vendorName: string;
    amountAgora: number;
    currency: 'ILS' | 'USD' | 'EUR';
    date: Date;
    category: 'Revenue' | 'DirectCost' | 'Overhead' | 'InventoryRestock' | 'Personal';
    workOrderId: string | null;
    inventoryItemId: string | null;
    status: 'approved' | 'pending_review' | 'rejected';
    aiConfidence: number | null;
    originalFileUrl: string | null;
    source: 'manual' | 'ai';
    sourceEmailRef: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    suggestedWorkOrderId: string | null;
    suggestedInventoryItemId: string | null;
    classificationReasoning: string | null;
    isEstimatedConversion: boolean;
    conversionRate: number | null;
    conversionRateDate: string | null;
    conversionRateStale: boolean;
  }>,
  loading: false,
  error: null as string | null,
  setTransactions: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

const mockConfigStore = {
  config: null as SystemConfig | null,
  loading: false,
  error: null as string | null,
  setConfig: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

const mockOhStore = {
  overhead: [] as Array<{
    id: string;
    category: string;
    amountAgora: number;
    currency: string;
    date: Date;
    description: string | null;
    recurrence: 'one_time' | 'monthly' | 'yearly';
    source: string;
    transactionId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>,
  loading: false,
  error: null as string | null,
  setOverhead: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

vi.mock('@/stores', () => ({
  useWorkOrderStore: () => mockWoStore,
  useTransactionStore: () => mockTxnStore,
  useSystemConfigStore: () => mockConfigStore,
  useOverheadStore: () => mockOhStore,
  calculateBurn: (entries: Array<{ amountAgora: number; recurrence: string }>) =>
    entries.reduce((sum, item) => {
      if (item.recurrence === 'yearly') return sum + Math.round(item.amountAgora / 12);
      return sum + item.amountAgora;
    }, 0),
}));

vi.mock('@/types', () => ({
  workOrderSchema: {},
  transactionSchema: {},
  systemConfigSchema: {},
  overheadSchema: {},
}));

const mockToIlsAgora = vi.fn((amount: number) => amount);
vi.mock('@/lib', () => ({
  toIlsAgora: (...args: unknown[]) => mockToIlsAgora(...args),
  calculateTaxReserve: (net: number, method: string, rate: number) => {
    if (net <= 0) return 0;
    if (method === 'flat') return Math.round(net * rate);
    return Math.round(net * 0.25); // simplified bracket mock
  },
}));

const { useDashboardData } = await import('./useDashboardData');

function createTransaction(overrides: Partial<typeof mockTxnStore.transactions[0]> = {}) {
  return {
    id: 'txn-1',
    vendorName: 'Vendor',
    amountAgora: 100_000,
    currency: 'ILS' as const,
    date: new Date(2026, 1, 5),
    category: 'Revenue' as const,
    workOrderId: null,
    inventoryItemId: null,
    status: 'approved' as const,
    aiConfidence: null,
    originalFileUrl: null,
    source: 'manual' as const,
    sourceEmailRef: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0)); // Feb 7, 2026

    mockWoStore.workOrders = [];
    mockWoStore.loading = false;
    mockWoStore.error = null;

    mockTxnStore.transactions = [];
    mockTxnStore.loading = false;
    mockTxnStore.error = null;

    mockConfigStore.config = null;
    mockConfigStore.loading = false;
    mockConfigStore.error = null;

    mockOhStore.overhead = [];
    mockOhStore.loading = false;
    mockOhStore.error = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns correct netProfitAgora for current month transactions', () => {
    mockTxnStore.transactions = [
      createTransaction({ id: 'r1', amountAgora: 500_000, category: 'Revenue' }),
      createTransaction({ id: 'c1', amountAgora: 200_000, category: 'DirectCost' }),
      createTransaction({ id: 'o1', amountAgora: 50_000, category: 'Overhead' }),
    ];

    const { result } = renderHook(() => useDashboardData());
    // 500,000 - 200,000 - 50,000 = 250,000
    expect(result.current.netProfitAgora).toBe(250_000);
  });

  it('returns taxJarAgora using config taxMethod and flatRate', () => {
    mockConfigStore.config = {
      taxMethod: 'flat',
      flatRate: 0.20,
      currencyRates: { ILS: 1, USD: 3.5, EUR: 3.8 },
      osPaturThresholdAgora: 12_000_000,
    };
    mockTxnStore.transactions = [
      createTransaction({ amountAgora: 1_000_000, category: 'Revenue' }),
    ];

    const { result } = renderHook(() => useDashboardData());
    // flat 20%: 1,000,000 * 0.20 = 200,000
    expect(result.current.taxJarAgora).toBe(200_000);
    expect(result.current.taxMethod).toBe('flat');
  });

  it('falls back to flat 35% when config is null', () => {
    mockConfigStore.config = null;
    mockTxnStore.transactions = [
      createTransaction({ amountAgora: 1_000_000, category: 'Revenue' }),
    ];

    const { result } = renderHook(() => useDashboardData());
    // flat 35%: 1,000,000 * 0.35 = 350,000
    expect(result.current.taxJarAgora).toBe(350_000);
    expect(result.current.taxMethod).toBe('flat');
  });

  it('returns osPaturWarning when annual revenue estimate >= 80% of threshold', () => {
    mockConfigStore.config = {
      taxMethod: 'flat',
      flatRate: 0.35,
      currencyRates: { ILS: 1, USD: 3.5, EUR: 3.8 },
      osPaturThresholdAgora: 12_000_000, // ₪120,000
    };
    // Monthly revenue = 900,000 agora (₪9,000) → annualized = 10,800,000
    // 80% of 12,000,000 = 9,600,000
    // 10,800,000 >= 9,600,000 → true
    mockTxnStore.transactions = [
      createTransaction({ amountAgora: 900_000, category: 'Revenue' }),
    ];

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.osPaturWarning).toBe(true);
  });

  it('returns osPaturWarning=false when revenue is below threshold', () => {
    mockConfigStore.config = {
      taxMethod: 'flat',
      flatRate: 0.35,
      currencyRates: { ILS: 1, USD: 3.5, EUR: 3.8 },
      osPaturThresholdAgora: 12_000_000,
    };
    // Monthly revenue = 50,000 agora → annualized = 600,000
    // 80% of 12,000,000 = 9,600,000
    // 600,000 < 9,600,000 → false
    mockTxnStore.transactions = [
      createTransaction({ amountAgora: 50_000, category: 'Revenue' }),
    ];

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.osPaturWarning).toBe(false);
  });

  it('returns loaded=false while any store is loading', () => {
    mockWoStore.loading = true;

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.loading).toBe(true);
    expect(result.current.loaded).toBe(false);
  });

  it('returns loaded=true when all stores have loaded', () => {
    mockWoStore.loading = false;
    mockTxnStore.loading = false;
    mockConfigStore.loading = false;

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.loading).toBe(false);
    expect(result.current.loaded).toBe(true);
  });

  it('correctly computes previous month delta', () => {
    mockTxnStore.transactions = [
      // Current month (Feb 2026) — revenue
      createTransaction({ id: 'r1', amountAgora: 500_000, category: 'Revenue', date: new Date(2026, 1, 5) }),
      // Previous month (Jan 2026) — revenue
      createTransaction({ id: 'r2', amountAgora: 300_000, category: 'Revenue', date: new Date(2026, 0, 15) }),
    ];

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.netProfitAgora).toBe(500_000);
    expect(result.current.previousMonthNetProfitAgora).toBe(300_000);
  });

  it('handles empty transactions array', () => {
    mockTxnStore.transactions = [];

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.netProfitAgora).toBe(0);
    expect(result.current.taxJarAgora).toBe(0);
    expect(result.current.pendingReviewCount).toBe(0);
    expect(result.current.osPaturWarning).toBe(false);
  });

  it('handles empty work orders array', () => {
    mockWoStore.workOrders = [];

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.activeProjectCount).toBe(0);
    expect(result.current.workOrders).toEqual([]);
  });

  it('counts active projects correctly', () => {
    const now = new Date();
    mockWoStore.workOrders = [
      {
        id: 'wo-1', status: 'Production', clientName: 'A', projectDescription: '',
        deadline: null, revenueTotalAgora: 0, directCostAgora: 0,
        inventoryCostAgora: 0, overheadAllocationAgora: 0, createdAt: now, updatedAt: now,
      },
      {
        id: 'wo-2', status: 'Design', clientName: 'B', projectDescription: '',
        deadline: null, revenueTotalAgora: 0, directCostAgora: 0,
        inventoryCostAgora: 0, overheadAllocationAgora: 0, createdAt: now, updatedAt: now,
      },
      {
        id: 'wo-3', status: 'Production', clientName: 'C', projectDescription: '',
        deadline: null, revenueTotalAgora: 0, directCostAgora: 0,
        inventoryCostAgora: 0, overheadAllocationAgora: 0, createdAt: now, updatedAt: now,
      },
    ];

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.activeProjectCount).toBe(2);
  });

  it('computes pending review breakdown', () => {
    mockTxnStore.transactions = [
      createTransaction({ id: 'p1', status: 'pending_review', aiConfidence: 90 }),
      createTransaction({ id: 'p2', status: 'pending_review', aiConfidence: 70 }),
      createTransaction({ id: 'p3', status: 'pending_review', aiConfidence: 95 }),
      createTransaction({ id: 'a1', status: 'approved' }),
    ];

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.pendingReviewCount).toBe(3);
    expect(result.current.pendingGreenCount).toBe(2); // 90 and 95 >= 85
    expect(result.current.pendingCheckCount).toBe(1); // 70 < 85
  });

  it('uses bracket tax method from config', () => {
    mockConfigStore.config = {
      taxMethod: 'bracket',
      flatRate: 0.35,
      currencyRates: { ILS: 1, USD: 3.5, EUR: 3.8 },
      osPaturThresholdAgora: 12_000_000,
    };
    mockTxnStore.transactions = [
      createTransaction({ amountAgora: 1_000_000, category: 'Revenue' }),
    ];

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.taxMethod).toBe('bracket');
    // bracket mock: 1,000,000 * 0.25 = 250,000
    expect(result.current.taxJarAgora).toBe(250_000);
  });

  it('returns configStore loading in composite loading state', () => {
    mockWoStore.loading = false;
    mockTxnStore.loading = false;
    mockConfigStore.loading = true;

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.loading).toBe(true);
    expect(result.current.loaded).toBe(false);
  });

  it('computes monthlyOverheadAgora from overhead collection using calculateBurn', () => {
    mockOhStore.overhead = [
      {
        id: 'oh-1', category: 'software', amountAgora: 5000, currency: 'ILS',
        date: new Date(2026, 1, 1), description: null, recurrence: 'monthly' as const,
        source: 'manual', transactionId: null, isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'oh-2', category: 'office', amountAgora: 12000, currency: 'ILS',
        date: new Date(2025, 5, 1), description: null, recurrence: 'yearly' as const,
        source: 'manual', transactionId: null, isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ];

    const { result } = renderHook(() => useDashboardData());
    // monthly 5000 + yearly Math.round(12000/12) = 5000 + 1000 = 6000
    expect(result.current.monthlyOverheadAgora).toBe(6000);
  });

  it('computes previousMonthOverheadAgora for recurring items', () => {
    mockOhStore.overhead = [
      {
        id: 'oh-1', category: 'software', amountAgora: 3000, currency: 'ILS',
        date: new Date(2026, 0, 15), description: null, recurrence: 'one_time' as const,
        source: 'manual', transactionId: null, isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'oh-2', category: 'office', amountAgora: 2000, currency: 'ILS',
        date: new Date(2025, 5, 1), description: null, recurrence: 'monthly' as const,
        source: 'manual', transactionId: null, isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ];

    const { result } = renderHook(() => useDashboardData());
    // Previous month (Jan 2026): one_time 3000 + monthly 2000 = 5000
    expect(result.current.previousMonthOverheadAgora).toBe(5000);
  });

  it('returns ohStore.loading in composite loading state', () => {
    mockWoStore.loading = false;
    mockTxnStore.loading = false;
    mockConfigStore.loading = false;
    mockOhStore.loading = true;

    const { result } = renderHook(() => useDashboardData());
    expect(result.current.loading).toBe(true);
    expect(result.current.loaded).toBe(false);
  });

  it('passes config currencyRates to toIlsAgora', () => {
    const customRates = { ILS: 1, USD: 4.0, EUR: 4.2 };
    mockConfigStore.config = {
      taxMethod: 'flat',
      flatRate: 0.35,
      currencyRates: customRates,
      osPaturThresholdAgora: 12_000_000,
    };
    mockTxnStore.transactions = [
      createTransaction({ amountAgora: 100_000, category: 'Revenue', currency: 'USD' }),
    ];

    mockToIlsAgora.mockClear();
    renderHook(() => useDashboardData());

    // Verify that toIlsAgora was called with the config's currencyRates
    const callWithRates = mockToIlsAgora.mock.calls.find(
      (call) => call[1] === 'USD' && call[2] !== undefined
    );
    expect(callWithRates).toBeDefined();
    expect(callWithRates![2]).toEqual(customRates);
  });
});
