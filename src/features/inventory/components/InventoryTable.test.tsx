import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { InventoryItem } from '@/types';

// Mock Phosphor icons — include all icons used transitively
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string; weight?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };

  return {
    ArrowUp: iconStub('ArrowUp'),
    ArrowDown: iconStub('ArrowDown'),
    ArrowCounterClockwise: iconStub('ArrowCounterClockwise'),
    ArrowBendDownRight: iconStub('ArrowBendDownRight'),
    Trash: iconStub('Trash'),
    // Toast icons (imported transitively via Button → components barrel)
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Warning: iconStub('Warning'),
    Info: iconStub('Info'),
    X: iconStub('X'),
    // Layout icons
    Bell: iconStub('Bell'),
    ChartBar: iconStub('ChartBar'),
    ClipboardText: iconStub('ClipboardText'),
    GearSix: iconStub('GearSix'),
    Tray: iconStub('Tray'),
    MagnifyingGlass: iconStub('MagnifyingGlass'),
    Package: iconStub('Package'),
    Plus: iconStub('Plus'),
    PencilSimple: iconStub('PencilSimple'),
  };
});

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

  it('renders Restock button when onRestock provided', () => {
    const onRestock = vi.fn();
    render(
      <InventoryTable items={testItems} loading={false} onRestock={onRestock} />,
    );
    const restockButtons = screen.getAllByText('inventory.restock.action');
    expect(restockButtons).toHaveLength(testItems.length);
  });

  it('calls onRestock with correct item when Restock button clicked', () => {
    const onRestock = vi.fn();
    render(
      <InventoryTable items={testItems} loading={false} onRestock={onRestock} />,
    );
    const restockButtons = screen.getAllByText('inventory.restock.action');
    fireEvent.click(restockButtons[0]);
    expect(onRestock).toHaveBeenCalledWith(testItems[0]);
  });

  it('does not render Restock button when onRestock not provided', () => {
    render(<InventoryTable items={testItems} loading={false} />);
    expect(screen.queryByText('inventory.restock.action')).not.toBeInTheDocument();
  });

  it('restock button click does not trigger row click', () => {
    const onRowClick = vi.fn();
    const onRestock = vi.fn();
    render(
      <InventoryTable
        items={testItems}
        loading={false}
        onRowClick={onRowClick}
        onRestock={onRestock}
      />,
    );
    const restockButtons = screen.getAllByText('inventory.restock.action');
    fireEvent.click(restockButtons[0]);
    expect(onRestock).toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('renders Scoop button when onScoop provided', () => {
    const onScoop = vi.fn();
    render(
      <InventoryTable items={testItems} loading={false} onScoop={onScoop} />,
    );
    const scoopButtons = screen.getAllByText('inventory.scoop.action');
    expect(scoopButtons).toHaveLength(testItems.length);
  });

  it('calls onScoop with correct item when Scoop button clicked', () => {
    const onScoop = vi.fn();
    render(
      <InventoryTable items={testItems} loading={false} onScoop={onScoop} />,
    );
    const scoopButtons = screen.getAllByText('inventory.scoop.action');
    fireEvent.click(scoopButtons[0]);
    expect(onScoop).toHaveBeenCalledWith(testItems[0]);
  });

  it('does not render Scoop button when onScoop not provided', () => {
    render(<InventoryTable items={testItems} loading={false} />);
    expect(screen.queryByText('inventory.scoop.action')).not.toBeInTheDocument();
  });

  it('disables Scoop button for items with zero stock', () => {
    const items = [makeItem({ id: '1', name: 'Empty', currentQty: 0 })];
    const onScoop = vi.fn();
    render(
      <InventoryTable items={items} loading={false} onScoop={onScoop} />,
    );
    const scoopButton = screen.getByText('inventory.scoop.action').closest('button')!;
    expect(scoopButton).toBeDisabled();
  });

  it('scoop button click does not trigger row click', () => {
    const onRowClick = vi.fn();
    const onScoop = vi.fn();
    render(
      <InventoryTable
        items={testItems}
        loading={false}
        onRowClick={onRowClick}
        onScoop={onScoop}
      />,
    );
    const scoopButtons = screen.getAllByText('inventory.scoop.action');
    fireEvent.click(scoopButtons[0]);
    expect(onScoop).toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('renders Waste button when onWaste provided', () => {
    const onWaste = vi.fn();
    render(
      <InventoryTable items={testItems} loading={false} onWaste={onWaste} />,
    );
    const wasteButtons = screen.getAllByText('inventory.waste.action');
    expect(wasteButtons).toHaveLength(testItems.length);
  });

  it('calls onWaste with correct item when Waste button clicked', () => {
    const onWaste = vi.fn();
    render(
      <InventoryTable items={testItems} loading={false} onWaste={onWaste} />,
    );
    const wasteButtons = screen.getAllByText('inventory.waste.action');
    fireEvent.click(wasteButtons[0]);
    expect(onWaste).toHaveBeenCalledWith(testItems[0]);
  });

  it('does not render Waste button when onWaste not provided', () => {
    render(<InventoryTable items={testItems} loading={false} />);
    expect(screen.queryByText('inventory.waste.action')).not.toBeInTheDocument();
  });

  it('disables Waste button for items with zero stock', () => {
    const items = [makeItem({ id: '1', name: 'Empty', currentQty: 0 })];
    const onWaste = vi.fn();
    render(
      <InventoryTable items={items} loading={false} onWaste={onWaste} />,
    );
    const wasteButton = screen.getByText('inventory.waste.action').closest('button')!;
    expect(wasteButton).toBeDisabled();
  });

  it('waste button click does not trigger row click', () => {
    const onRowClick = vi.fn();
    const onWaste = vi.fn();
    render(
      <InventoryTable
        items={testItems}
        loading={false}
        onRowClick={onRowClick}
        onWaste={onWaste}
      />,
    );
    const wasteButtons = screen.getAllByText('inventory.waste.action');
    fireEvent.click(wasteButtons[0]);
    expect(onWaste).toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
