import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { LoginScreen } from './LoginScreen';

// react-i18next and .module.scss handled by vitest resolve aliases

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/Loader', () => ({
  Loader: () => <div role="status">Loading...</div>,
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

  it('renders the sign-in button with translation key', () => {
    renderLoginScreen();

    expect(screen.getByRole('button', { name: /auth\.signIn/i })).toBeInTheDocument();
  });

  it('renders the branding logo and translated subtitle', () => {
    renderLoginScreen();

    expect(screen.getByAltText('TailorPlayed')).toBeInTheDocument();
    expect(screen.getByText('auth.appTitle')).toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: /auth\.signIn/i })).not.toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: /auth\.signIn/i })).not.toBeInTheDocument();
  });

  it('calls signIn when the sign-in button is clicked', async () => {
    mockSignIn.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderLoginScreen();

    await user.click(screen.getByRole('button', { name: /auth\.signIn/i }));

    expect(mockSignIn).toHaveBeenCalledOnce();
  });

  it('shows translated error message when sign-in is rejected', async () => {
    mockSignIn.mockRejectedValue(new Error('Access restricted to authorized users'));
    const user = userEvent.setup();

    renderLoginScreen();

    await user.click(screen.getByRole('button', { name: /auth\.signIn/i }));

    // Always shows translated generic error, not raw Firebase SDK message
    expect(screen.getByRole('alert')).toHaveTextContent('auth.signInFailed');
  });

  it('disables the button during sign-in flow', async () => {
    let resolveSignIn: () => void;
    mockSignIn.mockImplementation(
      () => new Promise<void>((resolve) => { resolveSignIn = resolve; }),
    );
    const user = userEvent.setup();

    renderLoginScreen();

    const button = screen.getByRole('button', { name: /auth\.signIn/i });
    await user.click(button);

    expect(screen.getByRole('button', { name: /auth\.signingIn/i })).toBeDisabled();

    await act(async () => {
      resolveSignIn!();
    });
  });
});
