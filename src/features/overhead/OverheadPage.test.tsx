import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@phosphor-icons/react', () => ({
  Receipt: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-Receipt" className={className} />
  ),
}));

vi.mock('./OverheadPage.module.scss', () => ({
  default: {
    placeholder: 'placeholder',
    icon: 'icon',
    title: 'title',
    description: 'description',
  },
}));

const { OverheadPage } = await import('./OverheadPage');

describe('OverheadPage', () => {
  it('renders without crashing', () => {
    render(<OverheadPage />);
    expect(screen.getByText('Overhead')).toBeInTheDocument();
  });

  it('displays placeholder message', () => {
    render(<OverheadPage />);
    expect(screen.getByText('Track monthly expenses and overhead costs here.')).toBeInTheDocument();
  });
});
