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
  activeProjectCount: 3,
  monthlyOverheadAgora: 150_000,
  previousMonthOverheadAgora: 140_000,
  pendingReviewCount: 5,
  pendingGreenCount: 3,
  pendingCheckCount: 2,
  loading: false,
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
      activeProjectCount: 3,
      monthlyOverheadAgora: 150_000,
      previousMonthOverheadAgora: 140_000,
      pendingReviewCount: 5,
      pendingGreenCount: 3,
      pendingCheckCount: 2,
      loading: false,
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

  it('renders Monthly Overhead KPI card with delta', () => {
    render(<DashboardPage />);
    expect(screen.getByText('dashboard.kpi.monthlyOverhead')).toBeInTheDocument();
    expect(screen.getByText('₪1500.00')).toBeInTheDocument();
    // (150000 - 140000) / 140000 * 100 ≈ 7%
    expect(screen.getByText(/7%/)).toBeInTheDocument();
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
    expect(screen.getByTestId('icon-Briefcase')).toBeInTheDocument();
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
});
