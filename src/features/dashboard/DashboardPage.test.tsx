import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Phosphor icons — include all icons used transitively
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };

  return {
    // DashboardPage direct
    CurrencyCircleDollar: iconStub('CurrencyCircleDollar'),
    Briefcase: iconStub('Briefcase'),
    Receipt: iconStub('Receipt'),
    Tray: iconStub('Tray'),
    // Toast component
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Warning: iconStub('Warning'),
    WarningCircle: iconStub('WarningCircle'),
    Info: iconStub('Info'),
    X: iconStub('X'),
    // Layout components
    Bell: iconStub('Bell'),
    ChartBar: iconStub('ChartBar'),
    ClipboardText: iconStub('ClipboardText'),
    GearSix: iconStub('GearSix'),
    // SearchInput
    MagnifyingGlass: iconStub('MagnifyingGlass'),
  };
});

// Mock auth
vi.mock('@/services', () => ({
  auth: {
    currentUser: {
      displayName: 'Gal Elbaz',
      uid: 'test-uid',
      email: 'test@example.com',
    },
  },
  db: {},
}));

// Mock formatCurrency and lib
vi.mock('@/lib', () => ({
  formatCurrency: (amount: number) => `₪${(amount / 100).toFixed(2)}`,
  calculateTaxReserve: (net: number, _method: string, rate: number) =>
    Math.round(net * rate),
  toIlsAgora: (amount: number) => amount,
  calculateMargin: (revenue: number, cost: number) => {
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue) * 100;
  },
  getMarginStatus: (margin: number) => {
    if (margin >= 30) return 'healthy';
    if (margin >= 20) return 'watch';
    return 'danger';
  },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useDashboardData — use mutable object
const mockDashboardData = {
  netProfitAgora: 820_000,
  previousMonthNetProfitAgora: 720_000,
  taxJarAgora: 287_000,
  taxMethod: 'flat' as const,
  activeProjectCount: 3,
  monthlyOverheadAgora: 150_000,
  previousMonthOverheadAgora: 140_000,
  pendingReviewCount: 5,
  pendingGreenCount: 3,
  pendingCheckCount: 2,
  osPaturWarning: false,
  osPaturPercent: 40,
  osPaturThresholdAgora: 12_000_000,
  workOrders: [
    {
      id: 'wo-1',
      clientName: 'Alpha Corp',
      projectDescription: 'Branding',
      deadline: null,
      status: 'Production',
      revenueTotalAgora: 1_000_000,
      directCostAgora: 400_000,
      inventoryCostAgora: 100_000,
      overheadAllocationAgora: 50_000,
      createdAt: new Date(2026, 0, 1),
      updatedAt: new Date(2026, 0, 15),
    },
    {
      id: 'wo-2',
      clientName: 'Beta Inc',
      projectDescription: 'Website',
      deadline: null,
      status: 'Design',
      revenueTotalAgora: 500_000,
      directCostAgora: 350_000,
      inventoryCostAgora: 50_000,
      overheadAllocationAgora: 0,
      createdAt: new Date(2026, 0, 5),
      updatedAt: new Date(2026, 0, 20),
    },
  ],
  loading: false,
  loaded: true,
};

vi.mock('./hooks', () => ({
  useDashboardData: () => mockDashboardData,
}));

const { DashboardPage } = await import('./DashboardPage');

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0));
    Object.assign(mockDashboardData, {
      netProfitAgora: 820_000,
      previousMonthNetProfitAgora: 720_000,
      taxJarAgora: 287_000,
      taxMethod: 'flat',
      activeProjectCount: 3,
      monthlyOverheadAgora: 150_000,
      previousMonthOverheadAgora: 140_000,
      pendingReviewCount: 5,
      pendingGreenCount: 3,
      pendingCheckCount: 2,
      osPaturWarning: false,
      osPaturPercent: 40,
      osPaturThresholdAgora: 12_000_000,
      workOrders: [
        {
          id: 'wo-1',
          clientName: 'Alpha Corp',
          projectDescription: 'Branding',
          deadline: null,
          status: 'Production',
          revenueTotalAgora: 1_000_000,
          directCostAgora: 400_000,
          inventoryCostAgora: 100_000,
          overheadAllocationAgora: 50_000,
          createdAt: new Date(2026, 0, 1),
          updatedAt: new Date(2026, 0, 15),
        },
        {
          id: 'wo-2',
          clientName: 'Beta Inc',
          projectDescription: 'Website',
          deadline: null,
          status: 'Design',
          revenueTotalAgora: 500_000,
          directCostAgora: 350_000,
          inventoryCostAgora: 50_000,
          overheadAllocationAgora: 0,
          createdAt: new Date(2026, 0, 5),
          updatedAt: new Date(2026, 0, 20),
        },
      ],
      loading: false,
      loaded: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<DashboardPage />);
    expect(screen.getByText('₪8200.00')).toBeInTheDocument();
  });

  it('renders HeroStat with user greeting', () => {
    render(<DashboardPage />);
    expect(
      screen.getByText('dashboard.greetingName|greeting=dashboard.greeting.morning|name=Gal'),
    ).toBeInTheDocument();
  });

  it('renders Tax Jar KPI card', () => {
    render(<DashboardPage />);
    expect(screen.getByText('dashboard.kpi.taxJar')).toBeInTheDocument();
    expect(screen.getByText('₪2870.00')).toBeInTheDocument();
    expect(screen.getByText('dashboard.kpi.taxJarSubtitle')).toBeInTheDocument();
  });

  it('renders Active Projects KPI card', () => {
    render(<DashboardPage />);
    expect(screen.getByText('dashboard.kpi.activeProjects')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('dashboard.kpi.activeProjectsSubtitle')).toBeInTheDocument();
  });

  it('renders Monthly Overhead KPI card with delta from overhead collection', () => {
    render(<DashboardPage />);
    expect(screen.getByText('dashboard.kpi.monthlyOverhead')).toBeInTheDocument();
    expect(screen.getByText('₪1500.00')).toBeInTheDocument();
    // (150000 - 140000) / 140000 * 100 ≈ 7% — delta inverted for overhead
    expect(screen.getByText(/7%/)).toBeInTheDocument();
  });

  it('overhead delta is inverted — decrease shows positive (green), increase shows negative (red)', () => {
    // Overhead decreased: 100_000 → 150_000 previous was more, current is less
    Object.assign(mockDashboardData, {
      monthlyOverheadAgora: 100_000,
      previousMonthOverheadAgora: 150_000,
    });
    render(<DashboardPage />);
    // (100000 - 150000) / 150000 * 100 = -33% → inverted to positive
    expect(screen.getByText(/33%/)).toBeInTheDocument();
  });

  it('renders Pending Review KPI card with breakdown', () => {
    render(<DashboardPage />);
    expect(screen.getByText('dashboard.kpi.pendingReview')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('navigates to /review when Pending Review card is clicked', () => {
    render(<DashboardPage />);
    const buttons = screen.getAllByRole('button');
    const pendingButton = buttons.find((btn) =>
      btn.textContent?.includes('dashboard.kpi.pendingReview'),
    );
    expect(pendingButton).toBeDefined();
    fireEvent.click(pendingButton!);
    expect(mockNavigate).toHaveBeenCalledWith('/review');
  });

  it('does not navigate when Pending Review count is 0', () => {
    Object.assign(mockDashboardData, {
      pendingReviewCount: 0,
      pendingGreenCount: 0,
      pendingCheckCount: 0,
    });
    render(<DashboardPage />);
    expect(screen.getByText('dashboard.kpi.allCaughtUp')).toBeInTheDocument();
    const buttons = screen.queryAllByRole('button');
    const pendingButton = buttons.find((btn) =>
      btn.textContent?.includes('dashboard.kpi.pendingReview'),
    );
    expect(pendingButton).toBeUndefined();
  });

  it('renders all 4 KPI Phosphor icons', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('icon-CurrencyCircleDollar')).toBeInTheDocument();
    // Briefcase appears in KPI card + ProjectRow rows — just verify at least one exists
    expect(screen.getAllByTestId('icon-Briefcase').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('icon-Receipt')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Tray')).toBeInTheDocument();
  });

  it('renders skeletons when loading', () => {
    mockDashboardData.loading = true;
    render(<DashboardPage />);
    expect(screen.getByTestId('hero-stat-skeleton')).toBeInTheDocument();
    const kpiSkeletons = screen.getAllByTestId('kpi-card-skeleton');
    expect(kpiSkeletons).toHaveLength(4);
  });

  it('renders Project Health section with work orders', () => {
    render(<DashboardPage />);
    expect(screen.getByText('dashboard.projectHealth.title')).toBeInTheDocument();
    expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
  });

  it('renders Project Health count subtitle', () => {
    render(<DashboardPage />);
    // 2 work orders, both non-shipped
    expect(screen.getByText('dashboard.projectHealth.count|count=2')).toBeInTheDocument();
  });

  it('renders empty state when no work orders', () => {
    Object.assign(mockDashboardData, { workOrders: [] });
    render(<DashboardPage />);
    expect(screen.getByText('dashboard.projectHealth.emptyTitle')).toBeInTheDocument();
  });

  it('navigates to work order detail when row is clicked', () => {
    render(<DashboardPage />);
    // Click the first row (Production comes before Design in sort order)
    const projectButtons = screen.getAllByRole('button').filter((btn) => {
      const label = btn.getAttribute('aria-label') ?? '';
      return label.includes('Alpha Corp');
    });
    expect(projectButtons).toHaveLength(1);
    fireEvent.click(projectButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/work-orders/wo-1');
  });

  it('renders skeleton rows for Project Health when loading', () => {
    mockDashboardData.loading = true;
    mockDashboardData.loaded = false;
    render(<DashboardPage />);
    const skeletonRows = screen.getAllByTestId('project-row-skeleton');
    expect(skeletonRows).toHaveLength(3);
  });

  it('applies fadeIn class when loaded is true', () => {
    mockDashboardData.loaded = true;
    const { container } = render(<DashboardPage />);
    const fadeInElements = container.querySelectorAll('.fadeIn');
    // 3 fadeIn wrappers: HeroStat, KPI row, ProjectList
    expect(fadeInElements.length).toBe(3);
  });

  it('does not apply fadeIn class when loaded is false', () => {
    mockDashboardData.loading = true;
    mockDashboardData.loaded = false;
    const { container } = render(<DashboardPage />);
    const fadeInElements = container.querySelectorAll('.fadeIn');
    expect(fadeInElements.length).toBe(0);
  });

  it('shows OsPaturBanner when osPaturWarning is true', () => {
    sessionStorage.clear();
    Object.assign(mockDashboardData, {
      osPaturWarning: true,
      osPaturPercent: 85,
      osPaturThresholdAgora: 12_000_000,
    });
    render(<DashboardPage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('hides OsPaturBanner when osPaturWarning is false', () => {
    Object.assign(mockDashboardData, { osPaturWarning: false });
    render(<DashboardPage />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('banner shows correct percentage', () => {
    sessionStorage.clear();
    Object.assign(mockDashboardData, {
      osPaturWarning: true,
      osPaturPercent: 92,
      osPaturThresholdAgora: 12_000_000,
    });
    render(<DashboardPage />);
    expect(screen.getByText(/92/)).toBeInTheDocument();
  });
});
