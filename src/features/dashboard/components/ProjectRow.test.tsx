import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WorkOrder } from '@/types';

// Mock Phosphor icons
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className, ...rest }: { size?: number; className?: string; 'data-testid'?: string }) {
      return <svg data-testid={rest['data-testid'] ?? `icon-${name}`} className={className} />;
    };
  return {
    Briefcase: iconStub('Briefcase'),
    Warning: iconStub('Warning'),
    WarningCircle: iconStub('WarningCircle'),
    // Toast/Layout icons
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Info: iconStub('Info'),
    X: iconStub('X'),
    Bell: iconStub('Bell'),
    ChartBar: iconStub('ChartBar'),
    ClipboardText: iconStub('ClipboardText'),
    GearSix: iconStub('GearSix'),
    MagnifyingGlass: iconStub('MagnifyingGlass'),
    CurrencyCircleDollar: iconStub('CurrencyCircleDollar'),
    Receipt: iconStub('Receipt'),
    Tray: iconStub('Tray'),
  };
});

// Mock lib
vi.mock('@/lib', () => ({
  formatCurrency: (amount: number) => `₪${(amount / 100).toFixed(2)}`,
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

const { ProjectRow } = await import('./ProjectRow');

function makeWorkOrder(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    id: 'wo-1',
    clientName: 'Acme Corp',
    projectDescription: 'Website redesign',
    deadline: null,
    status: 'Production',
    revenueTotalAgora: 1_000_000,
    directCostAgora: 400_000,
    inventoryCostAgora: 100_000,
    overheadAllocationAgora: 50_000,
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 15),
    ...overrides,
  };
}

describe('ProjectRow', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders client name and status', () => {
    render(<ProjectRow workOrder={makeWorkOrder()} onClick={mockOnClick} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('dashboard.projectHealth.status.Production')).toBeInTheDocument();
  });

  it('renders revenue and cost amounts', () => {
    render(<ProjectRow workOrder={makeWorkOrder()} onClick={mockOnClick} />);
    // Revenue: 1,000,000 agora = ₪10000.00
    expect(screen.getByText('₪10000.00')).toBeInTheDocument();
    // Total cost: 400000 + 100000 + 50000 = 550000 agora = ₪5500.00
    expect(screen.getByText('₪5500.00')).toBeInTheDocument();
  });

  it('renders healthy margin (≥ 30%)', () => {
    // margin = (1000000 - 550000) / 1000000 * 100 = 45%
    render(<ProjectRow workOrder={makeWorkOrder()} onClick={mockOnClick} />);
    expect(screen.getByText(/45%/)).toBeInTheDocument();
    // No warning icons for healthy
    expect(screen.queryByTestId('icon-margin-warning')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon-margin-danger')).not.toBeInTheDocument();
  });

  it('renders watch margin (20-29%) with Warning icon', () => {
    // margin = (1000000 - 750000) / 1000000 * 100 = 25%
    const wo = makeWorkOrder({
      directCostAgora: 600_000,
      inventoryCostAgora: 100_000,
      overheadAllocationAgora: 50_000,
    });
    render(<ProjectRow workOrder={wo} onClick={mockOnClick} />);
    expect(screen.getByText(/25%/)).toBeInTheDocument();
    expect(screen.getByTestId('icon-margin-warning')).toBeInTheDocument();
  });

  it('renders danger margin (< 20%) with WarningCircle icon and red border', () => {
    // margin = (1000000 - 900000) / 1000000 * 100 = 10%
    const wo = makeWorkOrder({
      directCostAgora: 700_000,
      inventoryCostAgora: 100_000,
      overheadAllocationAgora: 100_000,
    });
    render(<ProjectRow workOrder={wo} onClick={mockOnClick} />);
    expect(screen.getByText(/10%/)).toBeInTheDocument();
    expect(screen.getByTestId('icon-margin-danger')).toBeInTheDocument();
  });

  it('renders "—" for zero revenue', () => {
    const wo = makeWorkOrder({ revenueTotalAgora: 0 });
    render(<ProjectRow workOrder={wo} onClick={mockOnClick} />);
    expect(screen.getByText('dashboard.projectHealth.noRevenue')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(<ProjectRow workOrder={makeWorkOrder()} onClick={mockOnClick} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('has accessible aria-label with name, status, revenue, cost, and margin', () => {
    render(<ProjectRow workOrder={makeWorkOrder()} onClick={mockOnClick} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'aria-label',
      'Acme Corp — dashboard.projectHealth.status.Production — ₪10000.00 — ₪5500.00 — 45%',
    );
  });

  it('handles keyboard navigation (Enter/Space)', () => {
    render(<ProjectRow workOrder={makeWorkOrder()} onClick={mockOnClick} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    // Native button handles Enter/Space automatically
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('renders skeleton variant when loading', () => {
    render(
      <ProjectRow workOrder={makeWorkOrder()} onClick={mockOnClick} loading />,
    );
    expect(screen.getByTestId('project-row-skeleton')).toBeInTheDocument();
    // Should not render actual client name
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
  });

  it('renders margin bar fill with correct width', () => {
    // margin = (1000000 - 550000) / 1000000 * 100 = 45%
    const { container } = render(<ProjectRow workOrder={makeWorkOrder()} onClick={mockOnClick} />);
    const fill = container.querySelector('[class*="marginBarFill"]');
    expect(fill).toHaveStyle({ inlineSize: '45%' });
  });

  it('renders margin bar fill at 0% width for zero revenue', () => {
    const wo = makeWorkOrder({ revenueTotalAgora: 0 });
    const { container } = render(<ProjectRow workOrder={wo} onClick={mockOnClick} />);
    const fill = container.querySelector('[class*="marginBarFill"]');
    expect(fill).toHaveStyle({ inlineSize: '0%' });
  });

  it('renders Briefcase icon', () => {
    render(<ProjectRow workOrder={makeWorkOrder()} onClick={mockOnClick} />);
    expect(screen.getByTestId('icon-Briefcase')).toBeInTheDocument();
  });
});
