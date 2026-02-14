import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Overhead } from '@/types';

vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string; weight?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };

  return {
    Repeat: iconStub('Repeat'),
    Desktop: iconStub('Desktop'),
    ForkKnife: iconStub('ForkKnife'),
    Buildings: iconStub('Buildings'),
    DotsThreeCircle: iconStub('DotsThreeCircle'),
    // Transitively imported icons (Toast, Layout, etc.)
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Warning: iconStub('Warning'),
    Info: iconStub('Info'),
    Bell: iconStub('Bell'),
    ChartBar: iconStub('ChartBar'),
    ClipboardText: iconStub('ClipboardText'),
    GearSix: iconStub('GearSix'),
    Tray: iconStub('Tray'),
    MagnifyingGlass: iconStub('MagnifyingGlass'),
  };
});

vi.mock('@/lib/currency', () => ({
  formatCurrency: (amountAgora: number) => `₪${(amountAgora / 100).toFixed(2)}`,
}));

const { CategoryBreakdown } = await import('./CategoryBreakdown');

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

describe('CategoryBreakdown', () => {
  it('renders all categories with correct totals', () => {
    const overhead = [
      makeOverhead({ id: '1', category: 'software', amountAgora: 5000 }),
      makeOverhead({ id: '2', category: 'software', amountAgora: 3000 }),
      makeOverhead({ id: '3', category: 'meals', amountAgora: 2000 }),
    ];
    render(<CategoryBreakdown overhead={overhead} />);

    expect(screen.getByTestId('category-card-software')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-meals')).toBeInTheDocument();
    expect(screen.getByText('₪80.00')).toBeInTheDocument(); // software: 5000 + 3000
    expect(screen.getByText('₪20.00')).toBeInTheDocument(); // meals: 2000
  });

  it('sorts categories by amount (highest first)', () => {
    const overhead = [
      makeOverhead({ id: '1', category: 'meals', amountAgora: 10000 }),
      makeOverhead({ id: '2', category: 'software', amountAgora: 5000 }),
      makeOverhead({ id: '3', category: 'office', amountAgora: 20000 }),
    ];
    render(<CategoryBreakdown overhead={overhead} />);

    const cards = screen.getAllByTestId(/^category-card-/);
    expect(cards[0]).toHaveAttribute('data-testid', 'category-card-office');
    expect(cards[1]).toHaveAttribute('data-testid', 'category-card-meals');
    expect(cards[2]).toHaveAttribute('data-testid', 'category-card-software');
  });

  it('shows category icon and name', () => {
    const overhead = [makeOverhead({ category: 'software' })];
    render(<CategoryBreakdown overhead={overhead} />);

    expect(screen.getByTestId('icon-Desktop')).toBeInTheDocument();
    expect(screen.getByText('overhead.categories.software')).toBeInTheDocument();
  });

  it('formats amounts via formatCurrency', () => {
    const overhead = [makeOverhead({ category: 'meals', amountAgora: 15000 })];
    render(<CategoryBreakdown overhead={overhead} />);

    expect(screen.getByText('₪150.00')).toBeInTheDocument();
  });

  it('shows entry count per category', () => {
    const overhead = [
      makeOverhead({ id: '1', category: 'software' }),
      makeOverhead({ id: '2', category: 'software' }),
    ];
    render(<CategoryBreakdown overhead={overhead} />);

    expect(screen.getByText(/overhead\.breakdown\.entries/)).toBeInTheDocument();
  });

  it('handles empty overhead array (no categories rendered)', () => {
    const { container } = render(<CategoryBreakdown overhead={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('loading state shows skeletons', () => {
    render(<CategoryBreakdown overhead={[]} loading />);
    expect(screen.getByTestId('category-breakdown-loading')).toBeInTheDocument();
  });

  it('shows proportion bar for each category', () => {
    const overhead = [
      makeOverhead({ id: '1', category: 'software', amountAgora: 6000 }),
      makeOverhead({ id: '2', category: 'meals', amountAgora: 4000 }),
    ];
    render(<CategoryBreakdown overhead={overhead} />);

    expect(screen.getByTestId('proportion-bar-software')).toBeInTheDocument();
    expect(screen.getByTestId('proportion-bar-meals')).toBeInTheDocument();
  });

  it('proportion bar width matches percentage of total', () => {
    const overhead = [
      makeOverhead({ id: '1', category: 'software', amountAgora: 7500 }),
      makeOverhead({ id: '2', category: 'meals', amountAgora: 2500 }),
    ];
    render(<CategoryBreakdown overhead={overhead} />);

    // software = 7500/10000 = 75%, meals = 2500/10000 = 25%
    const softwareBar = screen.getByTestId('proportion-bar-software').firstElementChild as HTMLElement;
    expect(softwareBar.style.width).toBe('75%');

    const mealsBar = screen.getByTestId('proportion-bar-meals').firstElementChild as HTMLElement;
    expect(mealsBar.style.width).toBe('25%');
  });

  it('shows percentage label text', () => {
    const overhead = [
      makeOverhead({ id: '1', category: 'software', amountAgora: 7500 }),
      makeOverhead({ id: '2', category: 'meals', amountAgora: 2500 }),
    ];
    render(<CategoryBreakdown overhead={overhead} />);

    expect(screen.getByTestId('proportion-label-software').textContent).toBe('75%');
    expect(screen.getByTestId('proportion-label-meals').textContent).toBe('25%');
  });

  it('prorates yearly entries to amount/12 in category totals', () => {
    const overhead = [
      makeOverhead({ id: '1', category: 'software', amountAgora: 12000, recurrence: 'yearly' }),
      makeOverhead({ id: '2', category: 'software', amountAgora: 3000, recurrence: 'monthly' }),
    ];
    render(<CategoryBreakdown overhead={overhead} />);

    // software: Math.round(12000/12) + 3000 = 1000 + 3000 = 4000 agora = ₪40.00
    expect(screen.getByText('₪40.00')).toBeInTheDocument();
  });

  it('proportion bar is not rendered when total is 0', () => {
    // With no entries there's no rendering at all (returns null)
    const { container } = render(<CategoryBreakdown overhead={[]} />);
    expect(container.innerHTML).toBe('');
    expect(screen.queryByTestId(/proportion-bar/)).not.toBeInTheDocument();
  });
});
