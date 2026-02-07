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

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const { ProjectList } = await import('./ProjectList');

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

const mockWorkOrders: WorkOrder[] = [
  makeWorkOrder({ id: 'wo-1', clientName: 'Alpha', status: 'Lead', revenueTotalAgora: 500_000, directCostAgora: 300_000, inventoryCostAgora: 0, overheadAllocationAgora: 0 }),
  makeWorkOrder({ id: 'wo-2', clientName: 'Beta', status: 'Production', revenueTotalAgora: 1_000_000, directCostAgora: 400_000, inventoryCostAgora: 100_000, overheadAllocationAgora: 50_000 }),
  makeWorkOrder({ id: 'wo-3', clientName: 'Gamma', status: 'Design', revenueTotalAgora: 800_000, directCostAgora: 500_000, inventoryCostAgora: 50_000, overheadAllocationAgora: 50_000 }),
  makeWorkOrder({ id: 'wo-shipped', clientName: 'Delta', status: 'Shipped', revenueTotalAgora: 2_000_000, directCostAgora: 1_000_000, inventoryCostAgora: 0, overheadAllocationAgora: 0 }),
];

describe('ProjectList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders section header with title and count', () => {
    render(<ProjectList workOrders={mockWorkOrders} loading={false} />);
    expect(screen.getByText('dashboard.projectHealth.title')).toBeInTheDocument();
    // 3 non-shipped projects: count=3
    expect(screen.getByText('dashboard.projectHealth.count|count=3')).toBeInTheDocument();
  });

  it('filters out Shipped work orders', () => {
    render(<ProjectList workOrders={mockWorkOrders} loading={false} />);
    expect(screen.queryByText('Delta')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('sorts by status priority (Production → Design → Lead) then by margin ascending', () => {
    render(<ProjectList workOrders={mockWorkOrders} loading={false} />);
    const buttons = screen.getAllByRole('button');
    // Production first (Beta), then Design (Gamma), then Lead (Alpha)
    expect(buttons[0]).toHaveAttribute('aria-label', expect.stringContaining('Beta'));
    expect(buttons[1]).toHaveAttribute('aria-label', expect.stringContaining('Gamma'));
    expect(buttons[2]).toHaveAttribute('aria-label', expect.stringContaining('Alpha'));
  });

  it('navigates to work order detail on row click', () => {
    render(<ProjectList workOrders={mockWorkOrders} loading={false} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // Beta (Production)
    expect(mockNavigate).toHaveBeenCalledWith('/work-orders/wo-2');
  });

  it('renders empty state when no active work orders', () => {
    render(<ProjectList workOrders={[]} loading={false} />);
    expect(screen.getByText('dashboard.projectHealth.emptyTitle')).toBeInTheDocument();
    expect(screen.getByText('dashboard.projectHealth.emptyCta')).toBeInTheDocument();
  });

  it('renders empty state when only Shipped work orders exist', () => {
    const shippedOnly = [makeWorkOrder({ id: 'wo-shipped', status: 'Shipped' })];
    render(<ProjectList workOrders={shippedOnly} loading={false} />);
    expect(screen.getByText('dashboard.projectHealth.emptyTitle')).toBeInTheDocument();
  });

  it('empty state CTA navigates to /work-orders', () => {
    render(<ProjectList workOrders={[]} loading={false} />);
    const cta = screen.getByText('dashboard.projectHealth.emptyCta');
    fireEvent.click(cta);
    expect(mockNavigate).toHaveBeenCalledWith('/work-orders');
  });

  it('renders 3 skeleton rows when loading', () => {
    render(<ProjectList workOrders={[]} loading={true} />);
    const skeletons = screen.getAllByTestId('project-row-skeleton');
    expect(skeletons).toHaveLength(3);
  });

  it('shows title during loading state', () => {
    render(<ProjectList workOrders={[]} loading={true} />);
    expect(screen.getByText('dashboard.projectHealth.title')).toBeInTheDocument();
  });

  it('marks section as aria-busy during loading', () => {
    const { container } = render(<ProjectList workOrders={[]} loading={true} />);
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-busy', 'true');
  });
});
