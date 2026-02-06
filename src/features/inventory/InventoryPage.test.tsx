import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@phosphor-icons/react', () => ({
  Package: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-Package" className={className} />
  ),
}));

vi.mock('./InventoryPage.module.scss', () => ({
  default: {
    placeholder: 'placeholder',
    icon: 'icon',
    title: 'title',
    description: 'description',
  },
}));

const { InventoryPage } = await import('./InventoryPage');

describe('InventoryPage', () => {
  it('renders without crashing', () => {
    render(<InventoryPage />);
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('displays placeholder message', () => {
    render(<InventoryPage />);
    expect(screen.getByText('Manage your ingredients and stock levels here.')).toBeInTheDocument();
  });
});
