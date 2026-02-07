import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Hello</p></Card>);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('applies card styles', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstElementChild?.className).toContain('card');
  });

  it('does not have pointer cursor when not clickable', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstElementChild?.className).not.toContain('clickable');
  });

  it('adds clickable class when clickable', () => {
    const { container } = render(<Card clickable>Content</Card>);
    expect(container.firstElementChild?.className).toContain('clickable');
  });

  it('fires onClick when clickable', () => {
    const onClick = vi.fn();
    render(<Card clickable onClick={onClick}>Click</Card>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard activation when clickable', () => {
    const onClick = vi.fn();
    render(<Card clickable onClick={onClick}>Press</Card>);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has role=button when clickable', () => {
    render(<Card clickable>Role</Card>);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('does not have role=button when not clickable', () => {
    render(<Card>No Role</Card>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('applies additional className', () => {
    const { container } = render(<Card className="custom">Cls</Card>);
    expect(container.firstElementChild?.className).toContain('custom');
  });
});
