import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Phosphor icons
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string; weight?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };
  return {
    WarningCircle: iconStub('WarningCircle'),
    X: iconStub('X'),
    // Toast icons
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Warning: iconStub('Warning'),
    Info: iconStub('Info'),
  };
});

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

// Mock lib
vi.mock('@/lib', () => ({
  formatCurrency: (amountAgora: number) => `₪${(amountAgora / 100).toFixed(0)}`,
}));

const { OsPaturBanner } = await import('./OsPaturBanner');

describe('OsPaturBanner', () => {
  const defaultProps = {
    osPaturPercent: 85,
    thresholdAgora: 12_000_000,
  };

  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders banner with correct warning message and percentage', () => {
    render(<OsPaturBanner {...defaultProps} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.osPatur\.warning/)).toBeInTheDocument();
    expect(screen.getByText(/percent=85/)).toBeInTheDocument();
  });

  it('renders with the formatted threshold amount', () => {
    render(<OsPaturBanner {...defaultProps} />);
    // formatCurrency(12_000_000) = ₪120000
    expect(screen.getByText(/threshold=₪120000/)).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<OsPaturBanner {...defaultProps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders advice text', () => {
    render(<OsPaturBanner {...defaultProps} />);
    expect(screen.getByText('dashboard.osPatur.advice')).toBeInTheDocument();
  });

  it('dismiss button hides the banner', () => {
    render(<OsPaturBanner {...defaultProps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('dashboard.osPatur.dismiss'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('dismissed state persists via sessionStorage', () => {
    render(<OsPaturBanner {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('dashboard.osPatur.dismiss'));

    expect(sessionStorage.getItem('osPaturBannerDismissed')).toBe('true');
  });

  it('reappears when sessionStorage is cleared (simulating new session)', () => {
    sessionStorage.setItem('osPaturBannerDismissed', 'true');
    const { unmount } = render(<OsPaturBanner {...defaultProps} />);
    // Hidden because dismissed
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Simulate new session
    unmount();
    sessionStorage.clear();
    render(<OsPaturBanner {...defaultProps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('handles sessionStorage unavailability gracefully', () => {
    // Mock sessionStorage to throw
    const originalGetItem = sessionStorage.getItem;
    const originalSetItem = sessionStorage.setItem;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    // Should render without crashing (falls back to not dismissed)
    render(<OsPaturBanner {...defaultProps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Dismiss should work without crashing (swallows setItem error)
    fireEvent.click(screen.getByLabelText('dashboard.osPatur.dismiss'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Restore
    Storage.prototype.getItem = originalGetItem;
    Storage.prototype.setItem = originalSetItem;
  });

  it('renders WarningCircle icon', () => {
    render(<OsPaturBanner {...defaultProps} />);
    expect(screen.getByTestId('icon-WarningCircle')).toBeInTheDocument();
  });
});
