import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useUIStore } from '@/stores/useUIStore';

// Reset store between tests
beforeEach(() => {
  useUIStore.setState({ toasts: [] });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Toast', () => {
  it('renders toast message', async () => {
    const { Toast } = await import('./Toast');
    const toastData = {
      id: '1',
      type: 'success' as const,
      message: 'Saved!',
    };
    render(<Toast toast={toastData} onClose={() => {}} />);
    expect(screen.getByText('Saved!')).toBeTruthy();
  }, 15000);

  it('applies correct type class', async () => {
    const { Toast } = await import('./Toast');
    const toastData = {
      id: '2',
      type: 'error' as const,
      message: 'Error!',
    };
    const { container } = render(<Toast toast={toastData} onClose={() => {}} />);
    expect(container.firstElementChild?.className).toContain('error');
  });

  it('renders action button when provided', async () => {
    const { Toast } = await import('./Toast');
    const action = { label: 'Retry', onClick: vi.fn() };
    const toastData = {
      id: '3',
      type: 'error' as const,
      message: 'Failed',
      action,
    };
    render(<Toast toast={toastData} onClose={() => {}} />);
    const btn = screen.getByText('Retry');
    fireEvent.click(btn);
    expect(action.onClick).toHaveBeenCalled();
  });

  it('calls onClose when close button clicked', async () => {
    const { Toast } = await import('./Toast');
    const onClose = vi.fn();
    const toastData = {
      id: '4',
      type: 'info' as const,
      message: 'Info',
    };
    render(<Toast toast={toastData} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: 'components.toast.close' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledWith('4');
  });
});

describe('ToastContainer', () => {
  it('renders toasts from store', async () => {
    const { ToastContainer } = await import('./ToastContainer');
    useUIStore.getState().addToast({ type: 'success', message: 'Test toast' });
    render(<ToastContainer />);
    expect(screen.getByText('Test toast')).toBeTruthy();
  });

  it('shows max 3 toasts', async () => {
    const { ToastContainer } = await import('./ToastContainer');
    const store = useUIStore.getState();
    store.addToast({ type: 'success', message: 'T1' });
    store.addToast({ type: 'info', message: 'T2' });
    store.addToast({ type: 'warning', message: 'T3' });
    store.addToast({ type: 'error', message: 'T4' });

    render(<ToastContainer />);
    // Only last 3 visible
    expect(screen.queryByText('T1')).toBeNull();
    expect(screen.getByText('T2')).toBeTruthy();
    expect(screen.getByText('T3')).toBeTruthy();
    expect(screen.getByText('T4')).toBeTruthy();
  });

  it('auto-dismisses success toast after 3s', async () => {
    const { ToastContainer } = await import('./ToastContainer');
    useUIStore.getState().addToast({ type: 'success', message: 'Auto' });
    render(<ToastContainer />);
    expect(screen.getByText('Auto')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Auto')).toBeNull();
  });

  it('does not auto-dismiss warning toast', async () => {
    const { ToastContainer } = await import('./ToastContainer');
    useUIStore.getState().addToast({ type: 'warning', message: 'Persist' });
    render(<ToastContainer />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText('Persist')).toBeTruthy();
  });

  it('renders in portal (outside component tree)', async () => {
    const { ToastContainer } = await import('./ToastContainer');
    useUIStore.getState().addToast({ type: 'info', message: 'Portal test' });
    const { container } = render(
      <div data-testid="parent">
        <ToastContainer />
      </div>
    );
    // Toast should not be inside the parent div
    expect(container.querySelector('[data-testid="parent"]')?.textContent).toBe('');
    // But should be in document
    expect(screen.getByText('Portal test')).toBeTruthy();
  });

  it('has aria-live attribute', async () => {
    const { ToastContainer } = await import('./ToastContainer');
    useUIStore.getState().addToast({ type: 'info', message: 'Live' });
    render(<ToastContainer />);
    const region = screen.getByText('Live').closest('[aria-live]');
    expect(region?.getAttribute('aria-live')).toBe('polite');
  });
});

describe('useUIStore', () => {
  it('adds toast', () => {
    useUIStore.getState().addToast({ type: 'success', message: 'Added' });
    expect(useUIStore.getState().toasts).toHaveLength(1);
    expect(useUIStore.getState().toasts[0].message).toBe('Added');
  });

  it('removes toast', () => {
    useUIStore.getState().addToast({ type: 'info', message: 'Remove me' });
    const id = useUIStore.getState().toasts[0].id;
    useUIStore.getState().removeToast(id);
    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it('toast.success convenience works', async () => {
    const { toast } = await import('@/stores/useUIStore');
    toast.success('Quick');
    expect(useUIStore.getState().toasts[0].type).toBe('success');
    expect(useUIStore.getState().toasts[0].message).toBe('Quick');
  });

  it('toast.error convenience with action works', async () => {
    const { toast } = await import('@/stores/useUIStore');
    const action = { label: 'Retry', onClick: vi.fn() };
    toast.error('Failed', action);
    const t = useUIStore.getState().toasts[0];
    expect(t.type).toBe('error');
    expect(t.action?.label).toBe('Retry');
  });
});
