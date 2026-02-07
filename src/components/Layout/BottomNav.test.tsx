import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// react-i18next and .module.scss handled by vitest resolve aliases

vi.mock('@phosphor-icons/react', () => ({
  ChartBar: () => <svg data-testid="icon-ChartBar" />,
  ClipboardText: () => <svg data-testid="icon-ClipboardText" />,
  Tray: () => <svg data-testid="icon-Tray" />,
  GearSix: () => <svg data-testid="icon-GearSix" />,
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
  it('renders 4 navigation items with translated labels', () => {
    renderBottomNav();

    expect(screen.getByText('nav.home')).toBeInTheDocument();
    expect(screen.getByText('nav.orders')).toBeInTheDocument();
    expect(screen.getByText('nav.review')).toBeInTheDocument();
    expect(screen.getByText('nav.more')).toBeInTheDocument();
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

    const homeItem = screen.getByText('nav.home').closest('a');
    expect(homeItem?.className).toContain('navItemActive');
  });

  it('marks Orders as active on work-orders route', () => {
    renderBottomNav('/work-orders');

    const ordersItem = screen.getByText('nav.orders').closest('a');
    expect(ordersItem?.className).toContain('navItemActive');
  });

  it('marks Review as active on review route', () => {
    renderBottomNav('/review');

    const reviewItem = screen.getByText('nav.review').closest('a');
    expect(reviewItem?.className).toContain('navItemActive');
  });

  it('has accessible navigation landmark with translated label', () => {
    renderBottomNav();

    expect(screen.getByRole('navigation', { name: 'nav.mobileNavigation' })).toBeInTheDocument();
  });

  it('renders items as links', () => {
    renderBottomNav();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  it('does not mark More as active on root route', () => {
    renderBottomNav('/');

    const moreItem = screen.getByText('nav.more').closest('a');
    expect(moreItem?.className).not.toContain('navItemActive');
  });

  it('renders with CSS class for responsive hiding on tablet+', () => {
    renderBottomNav();

    const navElement = screen.getByRole('navigation', { name: 'nav.mobileNavigation' });
    expect(navElement.className).toContain('bottomNav');
  });
});
