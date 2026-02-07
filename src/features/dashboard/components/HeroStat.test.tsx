import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock formatCurrency
vi.mock('@/lib', () => ({
  formatCurrency: (amount: number) => `₪${(amount / 100).toFixed(2)}`,
}));

const { HeroStat } = await import('./HeroStat');

describe('HeroStat', () => {
  const defaultProps = {
    netProfitAgora: 820_000,
    previousMonthNetProfitAgora: 720_000,
    userName: 'Gal Elbaz',
    loading: false,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the net profit amount', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0));
    render(<HeroStat {...defaultProps} />);
    expect(screen.getByText('₪8200.00')).toBeInTheDocument();
  });

  it('renders morning greeting with first name', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 9, 0));
    render(<HeroStat {...defaultProps} />);
    // Mock t() returns key with appended params: "dashboard.greetingName|greeting=...|name=..."
    expect(
      screen.getByText('dashboard.greetingName|greeting=dashboard.greeting.morning|name=Gal'),
    ).toBeInTheDocument();
  });

  it('renders afternoon greeting', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 14, 0));
    render(<HeroStat {...defaultProps} />);
    expect(
      screen.getByText('dashboard.greetingName|greeting=dashboard.greeting.afternoon|name=Gal'),
    ).toBeInTheDocument();
  });

  it('renders evening greeting', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 20, 0));
    render(<HeroStat {...defaultProps} />);
    expect(
      screen.getByText('dashboard.greetingName|greeting=dashboard.greeting.evening|name=Gal'),
    ).toBeInTheDocument();
  });

  it('renders anonymous greeting when no user name', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0));
    render(<HeroStat {...defaultProps} userName="" />);
    expect(
      screen.getByText('dashboard.greetingAnonymous|greeting=dashboard.greeting.morning'),
    ).toBeInTheDocument();
  });

  it('renders net profit label with month/year', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0));
    render(<HeroStat {...defaultProps} />);
    expect(
      screen.getByText(/dashboard\.netProfitLabel\|monthYear=/),
    ).toBeInTheDocument();
  });

  it('renders positive delta badge with correct percentage', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0));
    render(<HeroStat {...defaultProps} />);
    // (820000 - 720000) / 720000 * 100 ≈ 14%
    expect(screen.getByText(/value=14/)).toBeInTheDocument();
  });

  it('renders negative delta badge with correct percentage', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0));
    render(
      <HeroStat
        {...defaultProps}
        netProfitAgora={500_000}
        previousMonthNetProfitAgora={820_000}
      />,
    );
    // (500000 - 820000) / 820000 * 100 ≈ -39%
    expect(screen.getByText(/value=39/)).toBeInTheDocument();
  });

  it('applies deltaPositive class for positive change', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0));
    render(<HeroStat {...defaultProps} />);
    const delta = screen.getByText(/direction=dashboard\.deltaUp/);
    expect(delta.className).toContain('deltaPositive');
  });

  it('applies deltaNegative class for negative change', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0));
    render(
      <HeroStat
        {...defaultProps}
        netProfitAgora={500_000}
        previousMonthNetProfitAgora={820_000}
      />,
    );
    const delta = screen.getByText(/direction=dashboard\.deltaDown/);
    expect(delta.className).toContain('deltaNegative');
  });

  it('hides delta when no previous month data', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0));
    render(<HeroStat {...defaultProps} previousMonthNetProfitAgora={null} />);
    expect(screen.queryByText(/delta/i)).not.toBeInTheDocument();
  });

  it('hides delta when previous month is zero', () => {
    vi.setSystemTime(new Date(2026, 1, 7, 10, 0));
    render(<HeroStat {...defaultProps} previousMonthNetProfitAgora={0} />);
    expect(screen.queryByText(/direction=/)).not.toBeInTheDocument();
  });

  it('renders skeleton placeholders when loading', () => {
    render(<HeroStat {...defaultProps} loading={true} />);
    expect(screen.getByTestId('hero-stat-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('₪8200.00')).not.toBeInTheDocument();
  });
});
