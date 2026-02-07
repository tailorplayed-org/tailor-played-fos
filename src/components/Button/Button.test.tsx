import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  // ── Variant Rendering ──
  it('renders primary variant by default', () => {
    render(<Button>Click</Button>);
    const btn = screen.getByRole('button', { name: 'Click' });
    expect(btn.className).toContain('primary');
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Sec</Button>);
    expect(screen.getByRole('button').className).toContain('secondary');
  });

  it('renders danger variant', () => {
    render(<Button variant="danger">Del</Button>);
    expect(screen.getByRole('button').className).toContain('danger');
  });

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button').className).toContain('ghost');
  });

  // ── Size Rendering ──
  it('renders medium size by default', () => {
    render(<Button>Med</Button>);
    expect(screen.getByRole('button').className).toContain('md');
  });

  it('renders small size', () => {
    render(<Button size="sm">Sm</Button>);
    expect(screen.getByRole('button').className).toContain('sm');
  });

  it('renders large size', () => {
    render(<Button size="lg">Lg</Button>);
    expect(screen.getByRole('button').className).toContain('lg');
  });

  // ── Loading State ──
  it('shows loading spinner and hides label', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('loading');
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn).toBeDisabled();
    // Spinner should exist
    const spinner = btn.querySelector('[aria-hidden="true"]');
    expect(spinner).toBeTruthy();
  });

  // ── Shortcut Hint ──
  it('displays keyboard shortcut hint', () => {
    render(<Button shortcut="⌘S">Save</Button>);
    const kbd = screen.getByText('⌘S');
    expect(kbd.tagName).toBe('KBD');
    expect(kbd.className).toContain('shortcut');
  });

  it('does not render shortcut when not provided', () => {
    render(<Button>No Shortcut</Button>);
    expect(screen.queryByRole('button')?.querySelector('kbd')).toBeNull();
  });

  // ── Disabled State ──
  it('prevents interaction when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  // ── Click Handler ──
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // ── Accessibility ──
  it('renders as button element', () => {
    render(<Button>Accessible</Button>);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('applies additional className', () => {
    render(<Button className="custom">Cls</Button>);
    expect(screen.getByRole('button').className).toContain('custom');
  });
});
