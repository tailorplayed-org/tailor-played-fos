import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws on demand
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Child content</div>;
}

// Suppress console.error noise during expected error tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('shows fallback UI on child error', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    // Mock returns translation keys as text
    expect(screen.getByText('components.errorBoundary.title')).toBeTruthy();
    expect(screen.getByText('components.errorBoundary.description')).toBeTruthy();
  });

  it('shows Try Again button that resets state', () => {
    let shouldThrow = true;
    function ConditionalThrow() {
      if (shouldThrow) throw new Error('Oops');
      return <div>Recovered</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('components.errorBoundary.title')).toBeTruthy();

    // Fix the error condition before clicking retry
    shouldThrow = false;
    fireEvent.click(screen.getByText('components.errorBoundary.tryAgain'));

    // Re-render to trigger recovery
    rerender(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered')).toBeTruthy();
  });

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(console.error).toHaveBeenCalledWith(
      '[ErrorBoundary]',
      expect.any(Error),
      expect.any(String)
    );
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeTruthy();
    expect(screen.queryByText('components.errorBoundary.title')).toBeNull();
  });

  it('calls onError callback', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });
});
