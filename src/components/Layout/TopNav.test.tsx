import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

// react-i18next and .module.scss handled by vitest resolve aliases
// Override the default mock to track changeLanguage calls
const mockChangeLanguage = vi.fn();
let mockLanguage = 'en';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params && 'count' in params) return `${params.count} ${key}`;
      return key;
    },
    i18n: {
      get language() {
        return mockLanguage;
      },
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

vi.mock('@phosphor-icons/react', () => ({
  Bell: ({ size }: { size?: number }) => (
    <svg data-testid="icon-Bell" width={size} />
  ),
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
  beforeEach(() => {
    mockLanguage = 'en';
    mockChangeLanguage.mockClear();
  });

  it('renders the logo with translated FOS label', () => {
    renderTopNav();

    expect(screen.getByAltText('TailorPlayed')).toBeInTheDocument();
    expect(screen.getByText('labels.fos')).toBeInTheDocument();
  });

  it('renders segmented nav tabs with translation keys', () => {
    renderTopNav();

    expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
    expect(screen.getByText('nav.workOrders')).toBeInTheDocument();
    expect(screen.getByText('nav.inventory')).toBeInTheDocument();
    expect(screen.getByText('nav.overhead')).toBeInTheDocument();
  });

  it('marks the active tab with active class', () => {
    renderTopNav();

    const dashboardTab = screen.getByText('nav.dashboard');
    expect(dashboardTab.className).toContain('tabActive');
  });

  it('does not mark inactive tabs with active class', () => {
    renderTopNav();

    const workOrdersTab = screen.getByText('nav.workOrders');
    expect(workOrdersTab.className).not.toContain('tabActive');
  });

  it('marks correct tab active based on route', () => {
    renderTopNav({}, '/work-orders');

    const workOrdersTab = screen.getByText('nav.workOrders');
    expect(workOrdersTab.className).toContain('tabActive');

    const dashboardTab = screen.getByText('nav.dashboard');
    expect(dashboardTab.className).not.toContain('tabActive');
  });

  it('renders pending review badge with count', () => {
    renderTopNav({ pendingCount: 5 });

    expect(screen.getByLabelText('5 nav.pendingReviews')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hides pending badge when count is 0', () => {
    renderTopNav({ pendingCount: 0 });

    const badge = screen.getByLabelText('0 nav.pendingReviews');
    expect(badge.className).toContain('pendingBadgeHidden');
  });

  it('has accessible navigation landmark with translated label', () => {
    renderTopNav();

    expect(screen.getByRole('navigation', { name: 'nav.mainNavigation' })).toBeInTheDocument();
  });

  it('renders all nav links', () => {
    renderTopNav();

    const links = screen.getAllByRole('link');
    // 1 logo link + 4 nav tabs + 1 pending badge link = 6
    expect(links.length).toBeGreaterThanOrEqual(5);
  });

  it('renders tab container with CSS class for responsive hiding', () => {
    renderTopNav();

    const navElement = screen.getByRole('navigation', { name: 'nav.mainNavigation' });
    const tabsContainer = navElement.querySelector('.navTabs');
    expect(tabsContainer).toBeInTheDocument();
  });

  // Language toggle tests
  it('renders the language toggle button', () => {
    renderTopNav();

    expect(screen.getByRole('button', { name: 'language.toggle' })).toBeInTheDocument();
  });

  it('displays "עב" when language is English (shows what you switch to)', () => {
    mockLanguage = 'en';
    renderTopNav();

    expect(screen.getByRole('button', { name: 'language.toggle' })).toHaveTextContent('עב');
  });

  it('displays "EN" when language is Hebrew (shows what you switch to)', () => {
    mockLanguage = 'he';
    renderTopNav();

    expect(screen.getByRole('button', { name: 'language.toggle' })).toHaveTextContent('EN');
  });

  it('calls changeLanguage when toggle is clicked', async () => {
    mockLanguage = 'he';
    const user = userEvent.setup();
    renderTopNav();

    await user.click(screen.getByRole('button', { name: 'language.toggle' }));

    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('switches to Hebrew when currently in English', async () => {
    mockLanguage = 'en';
    const user = userEvent.setup();
    renderTopNav();

    await user.click(screen.getByRole('button', { name: 'language.toggle' }));

    expect(mockChangeLanguage).toHaveBeenCalledWith('he');
  });
});
