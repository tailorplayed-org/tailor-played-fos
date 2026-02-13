import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { InventoryItem } from '@/types';

vi.mock('@phosphor-icons/react', () => ({
  ArrowUp: () => <svg data-testid="icon-ArrowUp" />,
  ArrowDown: () => <svg data-testid="icon-ArrowDown" />,
}));

const { InventoryTable } = await import('./InventoryTable');

const makeItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: 'item-1',
  name: 'Cardboard',
  sku: 'CBR-001',
  supplier: 'PaperInc',
  currentQty: 100,
  wacAgora: 350,
  reorderThreshold: 10,
  unit: 'sheets',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
  ...overrides,
});

const testItems: InventoryItem[] = [
  makeItem({ id: '1', name: 'Cardboard', currentQty: 100, wacAgora: 350 }),
  makeItem({ id: '2', name: 'Fabric', currentQty: 5, wacAgora: 1200, reorderThreshold: 10 }),
  makeItem({ id: '3', name: 'Thread', currentQty: 50, wacAgora: 200, sku: null, supplier: null }),
];

describe('InventoryTable', () => {
  it('renders all items', () => {
    render(<InventoryTable items={testItems} loading={false} />);
    expect(screen.getByText('Cardboard')).toBeInTheDocument();
    expect(screen.getByText('Fabric')).toBeInTheDocument();
    expect(screen.getByText('Thread')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<InventoryTable items={testItems} loading={false} />);
    expect(screen.getByText('inventory.columns.name')).toBeInTheDocument();
    expect(screen.getByText('inventory.columns.currentQty')).toBeInTheDocument();
    expect(screen.getByText('inventory.columns.wacPerUnit')).toBeInTheDocument();
  });

  it('shows Low Stock badge for items at or below reorder threshold', () => {
    render(<InventoryTable items={testItems} loading={false} />);
    // Fabric has currentQty 5 <= reorderThreshold 10
    const badges = screen.getAllByText('inventory.lowStock');
    expect(badges).toHaveLength(1);
  });

  it('does not show Low Stock badge for items above threshold', () => {
    const items = [makeItem({ currentQty: 100, reorderThreshold: 10 })];
    render(<InventoryTable items={items} loading={false} />);
    expect(screen.queryByText('inventory.lowStock')).not.toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    render(
      <InventoryTable
        items={[]}
        loading={false}
        emptyState={<div>No materials yet</div>}
      />
    );
    expect(screen.getByText('No materials yet')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<InventoryTable items={[]} loading />);
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('calls onRowClick when row is clicked', () => {
    const onClick = vi.fn();
    render(
      <InventoryTable items={testItems} loading={false} onRowClick={onClick} />
    );
    fireEvent.click(screen.getByText('Cardboard'));
    expect(onClick).toHaveBeenCalledWith(testItems[0]);
  });

  it('toggles sort direction when same column header clicked', () => {
    render(<InventoryTable items={testItems} loading={false} onRowClick={vi.fn()} />);
    const nameHeader = screen.getByRole('button', { name: /inventory.columns.name/i });

    // Initially sorted by name ascending
    fireEvent.click(nameHeader);
    // Should toggle to descending — check that ArrowDown appears
    expect(screen.getByTestId('icon-ArrowDown')).toBeInTheDocument();
  });

  it('shows dash for null sku and supplier', () => {
    const items = [makeItem({ sku: null, supplier: null })];
    render(<InventoryTable items={items} loading={false} />);
    const dashes = screen.getAllByText('—');
    // sku, supplier, and reorderThreshold could all be dashes
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('applies low stock row class for items at threshold', () => {
    const items = [
      makeItem({ id: '1', name: 'LowItem', currentQty: 10, reorderThreshold: 10 }),
    ];
    render(<InventoryTable items={items} loading={false} />);
    const row = screen.getByText('LowItem').closest('tr')!;
    expect(row.className).toContain('lowStockRow');
  });
});
