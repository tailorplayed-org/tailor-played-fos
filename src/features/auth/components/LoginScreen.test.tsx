import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { LoginScreen } from './LoginScreen';

// Mock the useAuth hook
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the SCSS module
vi.mock('./LoginScreen.module.scss', () => ({
  default: {
    container: 'container',
    card: 'card',
    title: 'title',
    subtitle: 'subtitle',
    signInButton: 'signInButton',
    buttonSpinner: 'buttonSpinner',
    error: 'error',
    spinner: 'spinner',
  },
}));

function renderLoginScreen(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signOut: mockSignOut,
    });
  });

  it('renders the sign-in button', () => {
    renderLoginScreen();

    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('renders the branding title and subtitle', () => {
    renderLoginScreen();

    expect(screen.getByText('TailorPlayed')).toBeInTheDocument();
    expect(screen.getByText('Financial Operations System')).toBeInTheDocument();
  });

  it('shows loading spinner while auth state is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: mockSignIn,
      signOut: mockSignOut,
    });

    renderLoginScreen();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('redirects to dashboard if user is already authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-uid', email: 'test@example.com' },
      loading: false,
      signIn: mockSignIn,
      signOut: mockSignOut,
    });

    renderLoginScreen();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('calls signIn when the sign-in button is clicked', async () => {
    mockSignIn.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderLoginScreen();

    await user.click(screen.getByRole('button', { name: /sign in with google/i }));

    expect(mockSignIn).toHaveBeenCalledOnce();
  });

  it('shows error message when sign-in is rejected', async () => {
    mockSignIn.mockRejectedValue(new Error('Access restricted to authorized users'));
    const user = userEvent.setup();

    renderLoginScreen();

    await user.click(screen.getByRole('button', { name: /sign in with google/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Access restricted to authorized users');
  });

  it('disables the button during sign-in flow', async () => {
    // Make signIn hang so we can check the button state mid-flow
    let resolveSignIn: () => void;
    mockSignIn.mockImplementation(
      () => new Promise<void>((resolve) => { resolveSignIn = resolve; }),
    );
    const user = userEvent.setup();

    renderLoginScreen();

    const button = screen.getByRole('button', { name: /sign in with google/i });
    await user.click(button);

    // Button should now be disabled with loading text
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    // Resolve the promise to clean up and avoid act() warning
    await act(async () => {
      resolveSignIn!();
    });
  });
});
