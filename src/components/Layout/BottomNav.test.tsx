import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.mock('@phosphor-icons/react', () => ({
  ChartBar: () => <svg data-testid="icon-ChartBar" />,
  ClipboardText: () => <svg data-testid="icon-ClipboardText" />,
  Tray: () => <svg data-testid="icon-Tray" />,
  GearSix: () => <svg data-testid="icon-GearSix" />,
}));

vi.mock('./BottomNav.module.scss', () => ({
  default: {
    bottomNav: 'bottomNav',
    navItem: 'navItem',
    navItemActive: 'navItemActive',
    navLabel: 'navLabel',
  },
}));

const { BottomNav } = await import('./BottomNav');

function renderBottomNav(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <BottomNav />
    </MemoryRouter>,
  );
}

describe('BottomNav', () => {
  it('renders 4 navigation items', () => {
    renderBottomNav();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders correct Phosphor icons', () => {
    renderBottomNav();

    expect(screen.getByTestId('icon-ChartBar')).toBeInTheDocument();
    expect(screen.getByTestId('icon-ClipboardText')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Tray')).toBeInTheDocument();
    expect(screen.getByTestId('icon-GearSix')).toBeInTheDocument();
  });

  it('marks Home as active on root route', () => {
    renderBottomNav('/');

    const homeItem = screen.getByText('Home').closest('a');
    expect(homeItem?.className).toContain('navItemActive');
  });

  it('marks Orders as active on work-orders route', () => {
    renderBottomNav('/work-orders');

    const ordersItem = screen.getByText('Orders').closest('a');
    expect(ordersItem?.className).toContain('navItemActive');
  });

  it('marks Review as active on review route', () => {
    renderBottomNav('/review');

    const reviewItem = screen.getByText('Review').closest('a');
    expect(reviewItem?.className).toContain('navItemActive');
  });

  it('has accessible navigation landmark', () => {
    renderBottomNav();

    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();
  });

  it('renders items as links', () => {
    renderBottomNav();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  it('does not mark More as active on root route', () => {
    renderBottomNav('/');

    const moreItem = screen.getByText('More').closest('a');
    expect(moreItem?.className).not.toContain('navItemActive');
  });

  it('renders with CSS class for responsive hiding on tablet+', () => {
    renderBottomNav();

    const navElement = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(navElement.className).toContain('bottomNav');
    // Responsive hiding (display: none at md+ breakpoint) is CSS-controlled
    // via @include md { .bottomNav { display: none } }
  });
});
