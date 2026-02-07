import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders with text variant by default', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('skeleton');
    expect(el.className).toContain('text');
  });

  it('renders circle variant', () => {
    const { container } = render(<Skeleton variant="circle" />);
    expect(container.firstElementChild?.className).toContain('circle');
  });

  it('renders rect variant', () => {
    const { container } = render(<Skeleton variant="rect" />);
    expect(container.firstElementChild?.className).toContain('rect');
  });

  it('applies custom width as number', () => {
    const { container } = render(<Skeleton width={200} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe('200px');
  });

  it('applies custom width as string', () => {
    const { container } = render(<Skeleton width="50%" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe('50%');
  });

  it('applies custom height', () => {
    const { container } = render(<Skeleton height={40} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.height).toBe('40px');
  });

  it('has shimmer class for animation', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild?.className).toContain('skeleton');
  });

  it('is hidden from accessibility tree', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies additional className', () => {
    const { container } = render(<Skeleton className="custom" />);
    expect(container.firstElementChild?.className).toContain('custom');
  });
});
