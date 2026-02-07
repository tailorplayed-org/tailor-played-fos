import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { AuthGuard } from './AuthGuard';

// Mock the useAuth hook
const mockUseAuth = vi.fn();

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the Loader component (uses Lottie which doesn't work in jsdom)
vi.mock('@/components/Loader', () => ({
  Loader: () => <div role="status">Loading...</div>,
}));

function renderWithRouter(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AuthGuard />}>
          <Route index element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while auth state is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders protected content when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-uid', email: 'test@example.com' },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
