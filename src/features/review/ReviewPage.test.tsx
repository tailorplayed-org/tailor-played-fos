import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@phosphor-icons/react', () => ({
  Tray: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-Tray" className={className} />
  ),
}));

vi.mock('./ReviewPage.module.scss', () => ({
  default: {
    placeholder: 'placeholder',
    icon: 'icon',
    title: 'title',
    description: 'description',
  },
}));

const { ReviewPage } = await import('./ReviewPage');

describe('ReviewPage', () => {
  it('renders without crashing', () => {
    render(<ReviewPage />);
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('displays placeholder message', () => {
    render(<ReviewPage />);
    expect(screen.getByText('Pending transactions awaiting your approval will appear here.')).toBeInTheDocument();
  });
});
