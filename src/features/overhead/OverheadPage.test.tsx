import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// react-i18next and .module.scss handled by vitest resolve aliases

vi.mock('@phosphor-icons/react', () => ({
  Receipt: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-Receipt" className={className} />
  ),
}));

const { OverheadPage } = await import('./OverheadPage');

describe('OverheadPage', () => {
  it('renders without crashing', () => {
    render(<OverheadPage />);
    expect(screen.getByText('pages.overhead.title')).toBeInTheDocument();
  });

  it('displays translated placeholder message', () => {
    render(<OverheadPage />);
    expect(screen.getByText('pages.overhead.placeholder')).toBeInTheDocument();
  });
});
