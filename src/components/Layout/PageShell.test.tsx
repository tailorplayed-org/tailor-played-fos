import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';

// Mock child components to isolate PageShell
vi.mock('./TopNav', () => ({
  TopNav: () => <div data-testid="top-nav">TopNav</div>,
}));

vi.mock('./BottomNav', () => ({
  BottomNav: () => <div data-testid="bottom-nav">BottomNav</div>,
}));

vi.mock('./PageShell.module.scss', () => ({
  default: {
    pageShell: 'pageShell',
    main: 'main',
  },
}));

const { PageShell } = await import('./PageShell');

function renderPageShell(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<PageShell />}>
          <Route index element={<div>Dashboard Content</div>} />
          <Route path="test" element={<div>Test Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('PageShell', () => {
  it('renders TopNav', () => {
    renderPageShell();

    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  it('renders BottomNav', () => {
    renderPageShell();

    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });

  it('renders child content via Outlet', () => {
    renderPageShell('/');

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('renders correct child route content', () => {
    renderPageShell('/test');

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders a main element', () => {
    renderPageShell();

    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
