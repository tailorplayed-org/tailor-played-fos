import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// react-i18next and .module.scss handled by vitest resolve aliases

vi.mock('@phosphor-icons/react', () => ({
  Package: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-Package" className={className} />
  ),
}));

const { InventoryPage } = await import('./InventoryPage');

describe('InventoryPage', () => {
  it('renders without crashing', () => {
    render(<InventoryPage />);
    expect(screen.getByText('pages.inventory.title')).toBeInTheDocument();
  });

  it('displays translated placeholder message', () => {
    render(<InventoryPage />);
    expect(screen.getByText('pages.inventory.placeholder')).toBeInTheDocument();
  });
});
