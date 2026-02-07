import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// react-i18next and .module.scss handled by vitest resolve aliases

vi.mock('@phosphor-icons/react', () => ({
  Tray: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-Tray" className={className} />
  ),
}));

const { ReviewPage } = await import('./ReviewPage');

describe('ReviewPage', () => {
  it('renders without crashing', () => {
    render(<ReviewPage />);
    expect(screen.getByText('pages.review.title')).toBeInTheDocument();
  });

  it('displays translated placeholder message', () => {
    render(<ReviewPage />);
    expect(screen.getByText('pages.review.placeholder')).toBeInTheDocument();
  });
});
