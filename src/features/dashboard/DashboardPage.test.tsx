import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@phosphor-icons/react', () => ({
  ChartBar: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-ChartBar" className={className} />
  ),
}));

vi.mock('./DashboardPage.module.scss', () => ({
  default: {
    placeholder: 'placeholder',
    icon: 'icon',
    title: 'title',
    description: 'description',
  },
}));

const { DashboardPage } = await import('./DashboardPage');

describe('DashboardPage', () => {
  it('renders without crashing', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays placeholder message', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Your financial cockpit is coming soon.')).toBeInTheDocument();
  });

  it('renders an icon', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('icon-ChartBar')).toBeInTheDocument();
  });
});
