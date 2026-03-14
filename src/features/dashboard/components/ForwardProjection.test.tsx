import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ size, weight }: { size?: number; weight?: string }) {
      return <svg data-testid={`icon-${name}`} data-size={size} data-weight={weight} />;
    };
  return {
    Calculator: iconStub('Calculator'),
    X: iconStub('X'),
    CheckCircle: iconStub('CheckCircle'),
    Warning: iconStub('Warning'),
    XCircle: iconStub('XCircle'),
    Package: iconStub('Package'),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params) return `${key}(${JSON.stringify(params)})`;
      return key;
    },
  }),
}));

vi.mock('@/lib', () => ({
  formatCurrency: (amount: number) => `₪${(amount / 100).toFixed(2)}`,
  toMinorUnits: (amount: number) => Math.round(amount * 100),
  buildFinancialSnapshot: (net: number, tax: number, oh: number, pipe: number) => ({
    netProfitAgora: net,
    taxJarAgora: tax,
    monthlyOverheadAgora: oh,
    availableBufferAgora: net - (net > 0 ? tax : 0) - oh,
    pipelineRevenueAgora: pipe,
  }),
  calculateProjection: (snapshot: {
    availableBufferAgora: number;
    monthlyOverheadAgora: number;
    taxJarAgora: number;
    pipelineRevenueAgora: number;
  }, purchaseAgora: number, isInventory: boolean) => {
    const buffer = snapshot.availableBufferAgora - purchaseAgora;
    const monthlyCost = snapshot.monthlyOverheadAgora + snapshot.taxJarAgora;
    const coverage = monthlyCost > 0 && buffer > 0 ? buffer / monthlyCost : 0;
    const assessment = coverage >= 2 ? 'healthy' : coverage > 0 ? 'tight' : 'negative';
    const monthlyPipeline = snapshot.pipelineRevenueAgora > 0
      ? Math.round(snapshot.pipelineRevenueAgora / 3) : 0;
    return {
      assessment,
      bufferAfterPurchaseAgora: buffer,
      monthlyCoverageMonths: Math.round(coverage * 10) / 10,
      monthsUntilAbsorbed: monthlyPipeline > 0 ? Math.ceil(purchaseAgora / monthlyPipeline) : null,
      shortfallAgora: buffer < 0 ? Math.abs(buffer) : 0,
      isInventoryPurchase: isInventory,
    };
  },
}));

const { ForwardProjection } = await import('./ForwardProjection');

const defaultProps = {
  netProfitAgora: 820_000,
  taxJarAgora: 287_000,
  monthlyOverheadAgora: 320_000,
  pipelineRevenueAgora: 1_400_000,
  onClose: vi.fn(),
};

describe('ForwardProjection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders financial snapshot with correct labels', () => {
    render(<ForwardProjection {...defaultProps} />);
    expect(screen.getByText('dashboard.projection.netProfit')).toBeInTheDocument();
    expect(screen.getByText('dashboard.projection.taxJar')).toBeInTheDocument();
    expect(screen.getByText('dashboard.projection.overhead')).toBeInTheDocument();
    expect(screen.getByText('dashboard.projection.buffer')).toBeInTheDocument();
    expect(screen.getByText('dashboard.projection.pipeline')).toBeInTheDocument();
  });

  it('renders formatted amounts in snapshot', () => {
    render(<ForwardProjection {...defaultProps} />);
    expect(screen.getByText('₪8200.00')).toBeInTheDocument(); // netProfit
    expect(screen.getByText('₪2870.00')).toBeInTheDocument(); // taxJar
    expect(screen.getByText('₪3200.00')).toBeInTheDocument(); // overhead
    expect(screen.getByText('₪14000.00')).toBeInTheDocument(); // pipeline
  });

  it('renders purchase input with ₪ prefix', () => {
    render(<ForwardProjection {...defaultProps} />);
    expect(screen.getByText('₪')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('renders inventory purchase checkbox', () => {
    render(<ForwardProjection {...defaultProps} />);
    expect(screen.getByText('dashboard.projection.inventoryPurchase')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('shows no projection result when input is empty', () => {
    render(<ForwardProjection {...defaultProps} />);
    expect(screen.queryByText(/dashboard\.projection\.assessment\./)).not.toBeInTheDocument();
  });

  it('shows healthy (green) assessment when buffer covers >= 2 months', () => {
    render(
      <ForwardProjection
        {...defaultProps}
        netProfitAgora={5_000_000}
        taxJarAgora={100_000}
        monthlyOverheadAgora={100_000}
      />,
    );
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '100' } });
    expect(screen.getByText('dashboard.projection.assessment.healthy')).toBeInTheDocument();
    expect(screen.getByTestId('icon-CheckCircle')).toBeInTheDocument();
  });

  it('shows tight (yellow) assessment when buffer covers < 2 months', () => {
    render(
      <ForwardProjection
        {...defaultProps}
        netProfitAgora={820_000}
        taxJarAgora={287_000}
        monthlyOverheadAgora={320_000}
      />,
    );
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '5' } });
    expect(screen.getByText('dashboard.projection.assessment.tight')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Warning')).toBeInTheDocument();
  });

  it('shows negative (red) assessment when purchase exceeds buffer', () => {
    render(<ForwardProjection {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '50000' } });
    expect(screen.getByText('dashboard.projection.assessment.negative')).toBeInTheDocument();
    expect(screen.getByTestId('icon-XCircle')).toBeInTheDocument();
  });

  it('shows shortfall amount when buffer goes negative', () => {
    render(<ForwardProjection {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '50000' } });
    expect(screen.getByText('dashboard.projection.shortfall')).toBeInTheDocument();
  });

  it('shows recovery time when pipeline revenue exists', () => {
    render(<ForwardProjection {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '100' } });
    expect(screen.getByText('dashboard.projection.recoveryTime')).toBeInTheDocument();
  });

  it('shows inventory note when checkbox is checked and input has value', () => {
    render(<ForwardProjection {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '100' } });
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(screen.getByText('dashboard.projection.inventoryNote')).toBeInTheDocument();
  });

  it('does not show inventory note when checkbox is unchecked', () => {
    render(<ForwardProjection {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '100' } });
    expect(screen.queryByText('dashboard.projection.inventoryNote')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ForwardProjection {...defaultProps} />);
    const closeButton = screen.getByLabelText('actions.cancel');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders projection panel with testid', () => {
    render(<ForwardProjection {...defaultProps} />);
    expect(screen.getByTestId('forward-projection')).toBeInTheDocument();
  });

  it('renders header with Calculator icon', () => {
    render(<ForwardProjection {...defaultProps} />);
    expect(screen.getByTestId('icon-Calculator')).toBeInTheDocument();
    expect(screen.getByText('dashboard.projection.title')).toBeInTheDocument();
  });
});
