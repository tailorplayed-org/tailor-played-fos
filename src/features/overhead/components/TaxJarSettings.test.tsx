import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock Phosphor icons
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string; weight?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };
  return {
    X: iconStub('X'),
    // Toast icons
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Warning: iconStub('Warning'),
    Info: iconStub('Info'),
  };
});

// Mock Firestore
const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockDocRef = { id: 'app', path: 'system_config/app' };
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => mockDocRef),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));
vi.mock('@/services', () => ({
  db: {},
}));

// Mock stores
const mockConfig = {
  taxMethod: 'flat' as const,
  flatRate: 0.35,
  currencyRates: { ILS: 1, USD: 3.6, EUR: 3.9 },
  osPaturThresholdAgora: 12_000_000,
  osPaturAlertPercent: 0.80,
};
vi.mock('@/stores', () => ({
  useSystemConfigStore: vi.fn(() => ({
    config: mockConfig,
    loading: false,
    error: null,
  })),
}));

const mockToast = { success: vi.fn(), error: vi.fn() };
vi.mock('@/stores/useUIStore', () => ({
  toast: mockToast,
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts) {
        return `${key}|${Object.entries(opts).map(([k, v]) => `${k}=${v}`).join('|')}`;
      }
      return key;
    },
  }),
}));

// Mock currency and lib
vi.mock('@/lib', () => ({
  formatCurrency: (amountAgora: number) => `₪${(amountAgora / 100).toFixed(2)}`,
  calculateTaxReserve: (net: number, _method: string, rate: number) =>
    Math.round(net * rate),
  calculateTaxBreakdown: (net: number, method: string, rate: number) => {
    if (net <= 0) return { method, totalTaxAgora: 0, rows: [] };
    if (method === 'flat') {
      const tax = Math.round(net * rate);
      return { method, totalTaxAgora: tax, rows: [{ label: `${Math.round(rate * 100)}%`, rate, taxableAgora: net, taxAgora: tax }] };
    }
    // Simplified bracket mock
    return {
      method,
      totalTaxAgora: Math.round(net * 0.15),
      rows: [
        { label: '10% (up to ₪86,220)', rate: 0.10, taxableAgora: net, taxAgora: Math.round(net * 0.10) },
        { label: '14% (₪86,221 – ₪123,740)', rate: 0.14, taxableAgora: 1000, taxAgora: 140 },
      ],
    };
  },
}));

// Mock components
vi.mock('@/components', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

const { TaxJarSettings } = await import('./TaxJarSettings');

describe('TaxJarSettings', () => {
  const defaultProps = {
    currentNetProfitAgora: 500_000,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetDoc.mockResolvedValue(undefined);
  });

  it('renders method toggle with flat/bracket options', () => {
    render(<TaxJarSettings {...defaultProps} />);
    expect(screen.getByText('settings.taxJar.flat')).toBeInTheDocument();
    expect(screen.getByText('settings.taxJar.bracket')).toBeInTheDocument();
  });

  it('initializes from store config (flat mode)', () => {
    render(<TaxJarSettings {...defaultProps} />);
    const flatButton = screen.getByText('settings.taxJar.flat');
    expect(flatButton.getAttribute('aria-checked')).toBe('true');
    const bracketButton = screen.getByText('settings.taxJar.bracket');
    expect(bracketButton.getAttribute('aria-checked')).toBe('false');
  });

  it('switches method toggle from flat to bracket', () => {
    render(<TaxJarSettings {...defaultProps} />);
    const bracketButton = screen.getByText('settings.taxJar.bracket');
    fireEvent.click(bracketButton);
    expect(bracketButton.getAttribute('aria-checked')).toBe('true');
  });

  it('shows flat rate input only in flat mode', () => {
    render(<TaxJarSettings {...defaultProps} />);
    expect(screen.getByLabelText('settings.taxJar.flatRateLabel')).toBeInTheDocument();
  });

  it('hides flat rate input in bracket mode', () => {
    render(<TaxJarSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('settings.taxJar.bracket'));
    expect(screen.queryByLabelText('settings.taxJar.flatRateLabel')).not.toBeInTheDocument();
  });

  it('shows bracket breakdown table in bracket mode', () => {
    render(<TaxJarSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('settings.taxJar.bracket'));
    expect(screen.getByText('settings.taxJar.bracketBreakdown')).toBeInTheDocument();
    expect(screen.getByText('settings.taxJar.bracketRange')).toBeInTheDocument();
    expect(screen.getByText('settings.taxJar.bracketTax')).toBeInTheDocument();
  });

  it('shows preview amount based on current settings', () => {
    render(<TaxJarSettings {...defaultProps} />);
    // 500_000 * 0.35 = 175_000 agora = ₪1750.00
    expect(screen.getByText('₪1750.00')).toBeInTheDocument();
  });

  it('shows dash when no net profit provided', () => {
    render(<TaxJarSettings currentNetProfitAgora={null} onClose={vi.fn()} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calls setDoc with merge:true on save', async () => {
    render(<TaxJarSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('settings.taxJar.save'));

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        { taxMethod: 'flat', flatRate: 0.35 },
        { merge: true },
      );
    });
  });

  it('shows success toast on successful save', async () => {
    render(<TaxJarSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('settings.taxJar.save'));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('settings.taxJar.saveSuccess');
    });
  });

  it('shows error toast on failed save', async () => {
    mockSetDoc.mockRejectedValueOnce(new Error('fail'));
    render(<TaxJarSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('settings.taxJar.save'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('settings.taxJar.saveError');
    });
  });

  it('clamps rate input between 1 and 100', () => {
    render(<TaxJarSettings {...defaultProps} />);
    const input = screen.getByLabelText('settings.taxJar.flatRateLabel') as HTMLInputElement;

    // Try to set value below 1 → clamped to 1
    fireEvent.change(input, { target: { value: '0' } });
    expect(input.value).toBe('1');

    // Try to set value above 100 → clamped to 100
    fireEvent.change(input, { target: { value: '150' } });
    expect(input.value).toBe('100');

    // Valid value within range
    fireEvent.change(input, { target: { value: '42' } });
    expect(input.value).toBe('42');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<TaxJarSettings currentNetProfitAgora={500_000} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('actions.cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders title text', () => {
    render(<TaxJarSettings {...defaultProps} />);
    expect(screen.getByText('settings.taxJar.title')).toBeInTheDocument();
  });
});
