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
});
