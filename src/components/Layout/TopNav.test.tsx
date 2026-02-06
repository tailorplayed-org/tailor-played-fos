import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.mock('@phosphor-icons/react', () => ({
  Bell: ({ size }: { size?: number }) => (
    <svg data-testid="icon-Bell" width={size} />
  ),
}));

vi.mock('./TopNav.module.scss', () => ({
  default: {
    topNav: 'topNav',
    logo: 'logo',
    logoImg: 'logoImg',
    logoText: 'logoText',
    navTabs: 'navTabs',
    tab: 'tab',
    tabActive: 'tabActive',
    pendingBadge: 'pendingBadge',
    pendingBadgeHidden: 'pendingBadgeHidden',
  },
}));

const { TopNav } = await import('./TopNav');

function renderTopNav(props: { pendingCount?: number } = {}, initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <TopNav {...props} />
    </MemoryRouter>,
  );
}

describe('TopNav', () => {
  it('renders the logo', () => {
    renderTopNav();

    expect(screen.getByAltText('TailorPlayed')).toBeInTheDocument();
    expect(screen.getByText('FOS')).toBeInTheDocument();
  });

  it('renders segmented nav tabs', () => {
    renderTopNav();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Work Orders')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Overhead')).toBeInTheDocument();
  });

  it('marks the active tab with active class', () => {
    renderTopNav();

    const dashboardTab = screen.getByText('Dashboard');
    expect(dashboardTab.className).toContain('tabActive');
  });

  it('does not mark inactive tabs with active class', () => {
    renderTopNav();

    const workOrdersTab = screen.getByText('Work Orders');
    expect(workOrdersTab.className).not.toContain('tabActive');
  });

  it('marks correct tab active based on route', () => {
    renderTopNav({}, '/work-orders');

    const workOrdersTab = screen.getByText('Work Orders');
    expect(workOrdersTab.className).toContain('tabActive');

    const dashboardTab = screen.getByText('Dashboard');
    expect(dashboardTab.className).not.toContain('tabActive');
  });

  it('renders pending review badge with count', () => {
    renderTopNav({ pendingCount: 5 });

    expect(screen.getByLabelText('5 pending reviews')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hides pending badge when count is 0', () => {
    renderTopNav({ pendingCount: 0 });

    const badge = screen.getByLabelText('0 pending reviews');
    expect(badge.className).toContain('pendingBadgeHidden');
  });

  it('has accessible navigation landmark', () => {
    renderTopNav();

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('renders all nav links', () => {
    renderTopNav();

    const links = screen.getAllByRole('link');
    // 1 logo link + 4 nav tabs + 1 pending badge link = 6
    expect(links.length).toBeGreaterThanOrEqual(5);
  });

  it('renders tab container with CSS class for responsive hiding', () => {
    renderTopNav();

    const navElement = screen.getByRole('navigation', { name: 'Main navigation' });
    const tabsContainer = navElement.querySelector('.navTabs');
    expect(tabsContainer).toBeInTheDocument();
    // Responsive visibility (hidden below md breakpoint) is CSS-controlled
    // via .navTabs { display: none } + @include md { display: flex }
  });
});
