import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// react-i18next and .module.scss handled by vitest resolve aliases

vi.mock('@phosphor-icons/react', () => ({
  ChartBar: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-ChartBar" className={className} />
  ),
}));

const { DashboardPage } = await import('./DashboardPage');

describe('DashboardPage', () => {
  it('renders without crashing', () => {
    render(<DashboardPage />);
    expect(screen.getByText('pages.dashboard.title')).toBeInTheDocument();
  });

  it('displays translated placeholder message', () => {
    render(<DashboardPage />);
    expect(screen.getByText('pages.dashboard.placeholder')).toBeInTheDocument();
  });

  it('renders an icon', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('icon-ChartBar')).toBeInTheDocument();
  });
});
